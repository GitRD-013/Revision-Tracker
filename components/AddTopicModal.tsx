import React, { useState, useEffect, useRef } from 'react';
import { Topic, AppSettings } from '../types';
import CustomDropdown from './UI/CustomDropdown';
import CustomDatePicker from './UI/CustomDatePicker';
import CustomTimePicker from './UI/CustomTimePicker';
import { GOOGLE_CALENDAR_COLORS } from '../services/calendarService';
import { generateRevisions } from '../services/revisionService';

const INPUT_STYLE = "w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary block p-2.5 sm:p-3.5 transition-all outline-none";

// --- Simple Rich Text Editor Component ---
interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
}

const SimpleRichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    const handleInput = () => {
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            if (Math.abs(editorRef.current.innerHTML.length - value.length) > 5) {
                editorRef.current.innerHTML = value;
            }
            if (editorRef.current.innerHTML === "" && value !== "") {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const btnClass = "p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-primary transition text-xs font-bold";

    return (
        <div className="w-full bg-gray-50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary border border-gray-200">
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200/50 bg-gray-50">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className={btnClass} title="Bold">B</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className={btnClass} title="Italic">I</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('underline'); }} className={btnClass} title="Underline">U</button>
            </div>
            <div
                ref={editorRef}
                className="w-full min-h-[120px] p-4 outline-none text-gray-800 overflow-y-auto prose prose-sm max-w-none bg-white"
                contentEditable
                onInput={handleInput}
            >
            </div>
        </div>
    );
};

interface AddTopicModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSave: (t: Topic, calendarOptions?: { time: string, colorId: string }) => void;
    onUpdateSettings?: (s: AppSettings) => void;
    initialData?: Topic | null;
}

// --- Constants ---
// No hardcoded map. We generate colors dynamically.

const AddTopicModal: React.FC<AddTopicModalProps> = ({ isOpen, onClose, settings, onSave, onUpdateSettings, initialData }) => {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [startDate, setStartDate] = useState('');
    const [notes, setNotes] = useState('');

    // Calendar Customization
    const [selectedTime, setSelectedTime] = useState('09:00');
    const [selectedColor, setSelectedColor] = useState('5'); // Default Banana (Yellow)

    // Auto-Select Color based on Subject (Index-based to ensure distribution)
    useEffect(() => {
        if (!subject) return;

        const normalizedSubject = subject.toLowerCase().trim();
        const existingIndex = settings.subjects.findIndex(s => s.toLowerCase() === normalizedSubject);

        let colorIndex = 0;

        if (existingIndex !== -1) {
            // Case 1: Subject is in the saved list.
            // Distribute colors deterministically based on order.
            colorIndex = existingIndex % GOOGLE_CALENDAR_COLORS.length;
        } else {
            // Case 2: New/Custom subject not yet saved.
            // We want a stable color that ideally doesn't clash with the first few default ones.
            // We can use a hash, but offset it by the current count to "append" it visually.
            let hash = 0;
            for (let i = 0; i < normalizedSubject.length; i++) {
                hash = normalizedSubject.charCodeAt(i) + ((hash << 5) - hash);
            }
            // Use the hash mixed with the current topics length to spread it out
            colorIndex = (Math.abs(hash) + settings.subjects.length) % GOOGLE_CALENDAR_COLORS.length;
        }

        const mappedColor = GOOGLE_CALENDAR_COLORS[colorIndex].id;
        setSelectedColor(mappedColor);
    }, [subject, settings.subjects]);

    // Reset form when modal opens or data changes
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setSubject(initialData.subject);
                setDifficulty(initialData.difficulty);
                setStartDate(initialData.startDate || new Date().toISOString().split('T')[0]);
                setNotes(initialData.notes || '');
                // For editing, we don't necessarily override time unless we stored it on the revision (we don't currently store time on revision objects, just events)
                // So default to current setting or standard
                setSelectedTime(settings.defaultCalendarTime || '09:00');

                // For editing, we trigger the subject effect which will set the color.
                // This mimics "restoring" the color if it matches the subject.
            } else {
                setTitle('');
                setSubject(settings.subjects[0] || 'General');
                setDifficulty('Medium');
                setStartDate(new Date().toISOString().split('T')[0]);
                setNotes('');
                // Use remembered time
                setSelectedTime(settings.defaultCalendarTime || '09:00');
                setSelectedColor('5');
            }
        }
    }, [isOpen, initialData, settings.subjects, settings.defaultCalendarTime]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const newTopic: Topic = {
            id: initialData?.id || crypto.randomUUID(),
            title,
            subject,
            difficulty,
            startDate,
            addedDate: initialData?.addedDate || new Date().toISOString(),
            notes,
            revisions: initialData?.revisions || generateRevisions(startDate, settings.defaultIntervals),
        };

        // Remember this time for next time (if changed)
        if (onUpdateSettings && selectedTime !== settings.defaultCalendarTime && !initialData) {
            // Only update default on NEW topics to avoid overwriting preference when just editing an old topic's details
            onUpdateSettings({ ...settings, defaultCalendarTime: selectedTime });
        }

        onSave(newTopic, { time: selectedTime, colorId: selectedColor });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl max-h-[90vh] flex flex-col animate-scale-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{initialData ? 'Edit Topic' : 'Add New Topic'}</h2>
                        <p className="text-gray-500 text-sm mt-0.5">Fill in the details below</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                    <form id="topic-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Topic Title</label>
                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className={INPUT_STYLE} placeholder="e.g. Calculus Integration" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CustomDropdown
                                label="Subject"
                                value={subject}
                                onChange={setSubject}
                                options={settings.subjects}
                                placeholder="Select Subject"
                            />
                            <CustomDropdown
                                label="Difficulty"
                                value={difficulty}
                                onChange={(v) => setDifficulty(v as any)}
                                options={['Easy', 'Medium', 'Hard']}
                            />
                        </div>
                        <CustomDatePicker
                            label="Start Date"
                            value={startDate}
                            onChange={setStartDate}
                        />

                        {/* Calendar Customization Section */}
                        {settings.googleCalendarConnected && (
                            <div className="bg-indigo-50/50 p-4 rounded-xl space-y-4 border border-indigo-100">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Google Calendar Settings
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <CustomTimePicker
                                            label="Default Time"
                                            value={selectedTime}
                                            onChange={setSelectedTime}
                                        />
                                    </div>

                                    <div>
                                        <CustomDropdown
                                            label="Event Color"
                                            value={selectedColor}
                                            onChange={setSelectedColor}
                                            options={GOOGLE_CALENDAR_COLORS.map(c => ({ value: c.id, label: c.name, hex: c.hex }))}
                                            icon={<div className="w-4 h-4 rounded-full" style={{ backgroundColor: GOOGLE_CALENDAR_COLORS.find(c => c.id === selectedColor)?.hex || '#ccc' }}></div>}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                            <SimpleRichTextEditor value={notes} onChange={setNotes} />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-6 h-12 flex items-center text-gray-700 font-semibold hover:bg-gray-200/50 rounded-xl transition-all active:scale-95">
                        Cancel
                    </button>
                    <button type="submit" form="topic-form" className="px-8 h-12 flex items-center bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-soft hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 whitespace-nowrap">
                        {initialData ? 'Save Changes' : 'Create Topic'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddTopicModal;
