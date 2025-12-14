import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Topic, RevisionStatus, Revision, AppSettings, DEFAULT_SETTINGS } from './types';
import { fetchUserData, saveUserTopics, saveUserSettings, checkAndMigrateData } from './services/storageService';

import * as NotificationService from './services/notificationService';
import * as CalendarService from './services/calendarService';
import { GOOGLE_CALENDAR_COLORS } from './services/calendarService';
import { AuthProvider, useAuth } from './context/AuthContext';
const LoginPage = React.lazy(() => import('./components/auth/LoginPage'));
const SignupPage = React.lazy(() => import('./components/auth/SignupPage'));
const ForgotPasswordPage = React.lazy(() => import('./components/auth/ForgotPasswordPage'));
const ProfilePage = React.lazy(() => import('./components/auth/ProfilePage'));
import ProtectedRoute from './components/auth/ProtectedRoute';

const Dashboard = React.lazy(() => import('./components/Dashboard'));
const TopicList = React.lazy(() => import('./components/TopicList'));
const SettingsPage = React.lazy(() => import('./components/SettingsPage'));
const TopicDetailView = React.lazy(() => import('./components/TopicDetailView'));
const CalendarPage = React.lazy(() => import('./components/CalendarPage'));

import Toast, { ToastType } from './components/UI/Toast';
import Skeleton from './components/UI/Skeleton';

// --- CONFIGURATION ---


// --- Standard Styles ---

const INPUT_STYLE = "w-full bg-white border border-gray-200 text-text text-sm rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary block p-3.5 transition-all";
const CONTAINER = "max-w-[1600px] mx-auto px-6 py-8";

// --- Helpers ---
const generateRevisions = (startDate: string, intervals: number[]): Revision[] => {
    return intervals.map((days) => {
        const [y, m, d] = startDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        date.setDate(date.getDate() + days);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return {
            id: crypto.randomUUID(),
            date: `${year}-${month}-${day}`,
            status: RevisionStatus.PENDING
        };
    });
};

import SideNavigation from './components/SideNavigation';
import AddTopicModal from './components/AddTopicModal';
import CustomDropdown from './components/UI/CustomDropdown';
import CustomTimePicker from './components/UI/CustomTimePicker';




const OfflineBanner = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="bg-gray-900 text-white text-center py-2 px-4 text-sm font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 011.414 0l4.242 4.242M6 6l4.243 4.243" /></svg>
            You are currently offline. Changes will be saved locally.
        </div>
    );
};

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
    }, []);

    const btnClass = "p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-primary transition text-xs font-bold";

    return (
        <div className="w-full bg-gray-50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary">
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200/50">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className={btnClass} title="Bold">B</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className={btnClass} title="Italic">I</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('underline'); }} className={btnClass} title="Underline">U</button>
            </div>
            <div
                ref={editorRef}
                className="w-full min-h-[120px] p-4 outline-none text-gray-800 overflow-y-auto prose prose-sm max-w-none"
                contentEditable
                onInput={handleInput}
            >
            </div>
        </div>
    );
};

// --- Custom Select Component ---
const CustomSelect = ({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: string[], placeholder?: string }) => {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${INPUT_STYLE} appearance-none cursor-pointer pr-10`}
            >
                {placeholder && <option value="" disabled>{placeholder}</option>}
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>
    )
}





// --- Form & Settings Components ---
const AddTopicForm = ({ settings, onSave, initialData }: { settings: AppSettings; onSave: (t: Topic, calendarOptions?: { time: string, colorId: string }) => void; initialData?: Topic }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    const [title, setTitle] = useState(initialData?.title || '');
    const [subject, setSubject] = useState(initialData?.subject || settings.subjects[0] || 'General');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(initialData?.difficulty || 'Medium');
    const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState(initialData?.notes || '');

    // Calendar Customization
    const [selectedTime, setSelectedTime] = useState('09:00');
    const [selectedColor, setSelectedColor] = useState('5'); // Default Banana (Yellow)

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        if (isSubmitting) return; // Prevent double submit
        setIsSubmitting(true);
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
        onSave(newTopic, { time: selectedTime, colorId: selectedColor });
        navigate(from);
    };

    return (
        <div className={CONTAINER}>
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm"
                        title="Go Back"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-3xl font-bold text-text">{initialData ? 'Edit Topic' : 'Add New Topic'}</h2>
                </div>

                {/* Main White Card Container */}
                <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
                    <div className="mb-8">
                        <p className="text-text-light mt-1">Fill in the details below</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Topic Title</label>
                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className={INPUT_STYLE} placeholder="e.g. Calculus Integration" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                                <CustomSelect value={subject} onChange={setSubject} options={settings.subjects} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                                <CustomSelect value={difficulty} onChange={(v) => setDifficulty(v as any)} options={['Easy', 'Medium', 'Hard']} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                            <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className={INPUT_STYLE} />
                        </div>

                        {/* Calendar Customization Section */}
                        {settings.googleCalendarConnected && (
                            <div className="bg-indigo-50/50 p-6 rounded-xl space-y-4 border border-indigo-100">
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
                        <div className="pt-6">
                            <button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold text-base py-3.5 rounded-xl shadow-soft transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Topic')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const EditTopicWrapper = ({ topics, settings, onSave }: { topics: Topic[], settings: AppSettings, onSave: (t: Topic, calendarOptions?: { time: string, colorId: string }) => void }) => {
    const { id } = useParams();
    const topic = topics.find(t => t.id === id);
    if (!topic) return <div className="p-12 text-center text-gray-400">Topic not found</div>;
    return <AddTopicForm settings={settings} onSave={onSave} initialData={topic} />;
};





// --- App Content ---
const AppContent = () => {
    // --- State Management ---
    const { currentUser, loading } = useAuth();

    // Initialize with empty/defaults. Data will be fetched on auth.
    const [topics, setTopics] = useState<Topic[]>([]);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [toast, setToast] = useState<{ msg: string, type: ToastType } | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Layout State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const syncInProgress = useRef<Set<string>>(new Set());

    const showToast = (msg: string, type: ToastType) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Load Data from Firestore when User Changes
    useEffect(() => {
        const loadData = async () => {
            if (currentUser) {
                try {
                    setIsLoadingData(true);

                    // Check and migrate local data to Firestore (one-time)
                    const migrated = await checkAndMigrateData(currentUser.uid);
                    if (migrated) {
                        showToast("Local data migrated to cloud", 'success');
                    }

                    const { topics: fetchedTopics, settings: fetchedSettings } = await fetchUserData(currentUser.uid);
                    setTopics(fetchedTopics);
                    setSettings(fetchedSettings);
                } catch (error: any) {
                    console.error("Failed to fetch user data:", error);
                    showToast(error.message || "Failed to load data", 'error');
                } finally {
                    setIsLoadingData(false);
                }
            } else {
                setTopics([]);
                setSettings(DEFAULT_SETTINGS);
                setIsLoadingData(false);
            }
        };
        loadData();
    }, [currentUser]);

    // Check for notifications when topics or settings change
    useEffect(() => {
        if (topics.length > 0 && settings.notifications.enabled) {
            NotificationService.checkAndScheduleNotifications(topics, settings);
        }
    }, [topics, settings.notifications.enabled]);

    // Initialize Google Calendar Service
    useEffect(() => {
        const clientID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        console.log("Initializing Gapi with Client ID:", clientID ? "Found" : "Missing");

        if (clientID) {
            CalendarService.initGapi(clientID, async (success) => {
                console.log("Google Calendar Service Initialized:", success);
                // We rely on lazy authentication (ensureToken) when saving topics.
                // This prevents "Sign In" popups from appearing immediately on app load.
            });
        } else {
            console.warn("VITE_GOOGLE_CLIENT_ID is missing in .env");
            // Optional: Warn user visible
            // showToast("Missing Google Client ID in .env", 'error'); 
        }
    }, [settings.googleCalendarConnected]);


    const saveTopicsToDb = async (newTopics: Topic[]) => {
        setTopics(newTopics);
        if (currentUser) {
            try {
                await saveUserTopics(currentUser.uid, newTopics);
            } catch (error: any) {
                showToast(error.message || "Failed to sync data", 'error');
            }
        }
    };

    const handleSaveTopic = async (updatedTopic: Topic, calendarOptions?: { time: string, colorId: string }) => {
        // 1. Optimistic Save: Save locally/DB first to ensure UI responsiveness and data safety
        let topicToSave = { ...updatedTopic };
        const exists = topics.some(t => t.id === topicToSave.id);
        const newTopics = exists ? topics.map(t => t.id === topicToSave.id ? topicToSave : t) : [...topics, topicToSave];
        saveTopicsToDb(newTopics);

        // 2. Background Sync: Attempt to sync with Google Calendar if connected
        // Check preference flag instead of active token (lazy init)
        if (settings.googleCalendarConnected) {
            // Prevent concurrent syncs for the same topic
            if (syncInProgress.current.has(topicToSave.id)) {
                console.log("Sync already in progress for topic", topicToSave.id);
                return;
            }
            syncInProgress.current.add(topicToSave.id);

            try {
                // If it's a new topic (or we want to ensure all revisions have events), we iterate
                // Ideally, we only add events that don't have IDs yet.
                let revisionsChanged = false;
                const updatedRevisions = await Promise.all(topicToSave.revisions.map(async (rev) => {
                    if (!rev.googleEventId && rev.status === RevisionStatus.PENDING) {
                        // Pass the subject, time, and colorId
                        const eventId = await CalendarService.addEventToCalendar(
                            topicToSave.title,
                            rev.date,
                            topicToSave.subject,
                            calendarOptions?.time,
                            calendarOptions?.colorId
                        );
                        if (eventId) {
                            revisionsChanged = true;
                            return { ...rev, googleEventId: eventId };
                        }
                    }
                    return rev;
                }));

                if (revisionsChanged) {
                    topicToSave = { ...topicToSave, revisions: updatedRevisions };
                    const updatedTopicsWithIds = newTopics.map(t => t.id === topicToSave.id ? topicToSave : t);
                    saveTopicsToDb(updatedTopicsWithIds);
                    console.log("Synced with Google Calendar and updated IDs");
                }
            } catch (err) {
                console.error("Failed to sync with calendar", err);
                showToast("Failed to sync with Google Calendar, but topic is saved locally", 'error');
            } finally {
                syncInProgress.current.delete(topicToSave.id);
            }
        }
    };

    const handleDeleteTopic = async (id: string) => {
        const topicToDelete = topics.find(t => t.id === id);
        // Check preference flag instead of active token (lazy init)
        if (topicToDelete && settings.googleCalendarConnected) {
            // Delete associated calendar events
            for (const rev of topicToDelete.revisions) {
                if (rev.googleEventId) {
                    await CalendarService.deleteEventFromCalendar(rev.googleEventId);
                }
            }
        }

        const newTopics = topics.filter(t => t.id !== id);
        saveTopicsToDb(newTopics);
        showToast("Topic deleted", 'success');
    };

    const handleDuplicateTopic = (topic: Topic) => {
        const dup = { ...topic, id: crypto.randomUUID(), title: `${topic.title} (Copy)`, addedDate: new Date().toISOString() };
        const newTopics = [...topics, dup];
        saveTopicsToDb(newTopics);
    };

    const handleStatusUpdate = (topicId: string, revId: string, status: RevisionStatus) => {
        const newTopics = topics.map(t => t.id !== topicId ? t : { ...t, revisions: t.revisions.map(r => r.id === revId ? { ...r, status } : r) });
        saveTopicsToDb(newTopics);
    };

    const handleSaveSettings = async (newSettings: AppSettings) => {
        setSettings(newSettings);
        if (currentUser) {
            try {
                await saveUserSettings(currentUser.uid, newSettings);
                showToast("Settings saved", 'success');
            } catch (error: any) {
                showToast(error.message || "Failed to save settings", 'error');
            }
        }
    };

    if (isLoadingData) {
        return (
            <div className="flex min-h-screen bg-transparent font-sans text-gray-900">
                <SideNavigation isOpen={false} onCloseMobile={() => { }} onHoverChange={() => { }} isExpanded={false} />
                <main className="flex-1 w-full lg:ml-20 p-8 space-y-8">
                    <div className="flex justify-between items-end">
                        <div className="space-y-2">
                            <Skeleton className="w-48 h-10" />
                            <Skeleton className="w-64 h-6" />
                        </div>
                        <Skeleton className="w-32 h-12 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-56 rounded-[2rem]" />)}
                    </div>
                    <Skeleton className="h-64 rounded-[2rem]" />
                </main>
            </div>
        )
    }




    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="loader"></div></div>;


    return (
        <div className="min-h-screen bg-background font-sans text-gray-900">
            <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="loader"></div></div>}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    <Route path="*" element={
                        <ProtectedRoute>
                            <div className="flex min-h-screen">
                                <OfflineBanner />

                                <SideNavigation
                                    isOpen={isSidebarOpen}
                                    onCloseMobile={() => setIsSidebarOpen(false)}
                                    onHoverChange={setIsSidebarExpanded}
                                    isExpanded={isSidebarExpanded}
                                />

                                {/* Mobile Header */}
                                {/* Mobile Header - Menu Button Only */}
                                <div className="lg:hidden fixed top-0 left-0 z-30 p-4">
                                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/50 backdrop-blur-sm shadow-sm border border-gray-100 text-gray-600 hover:bg-white rounded-xl transition-all">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                    </button>
                                </div>

                                {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

                                <AddTopicModal
                                    isOpen={isTopicModalOpen}
                                    onClose={() => setIsTopicModalOpen(false)}
                                    settings={settings}
                                    onSave={handleSaveTopic}
                                />

                                <main
                                    className={`flex-1 transition-all duration-300 ${isSidebarExpanded ? 'lg:ml-64' : 'lg:ml-20'} pt-16 lg:pt-0`}
                                >
                                    <Routes>
                                        <Route path="/" element={<Dashboard topics={topics} onStatusUpdate={handleStatusUpdate} onAddTopic={() => setIsTopicModalOpen(true)} />} />
                                        <Route path="/topics" element={<TopicList topics={topics} onDelete={handleDeleteTopic} onDuplicate={handleDuplicateTopic} onAddTopic={() => setIsTopicModalOpen(true)} />} />
                                        <Route path="/add" element={<AddTopicForm settings={settings} onSave={handleSaveTopic} />} />
                                        <Route path="/edit/:id" element={<EditTopicWrapper topics={topics} settings={settings} onSave={handleSaveTopic} />} />
                                        <Route path="/settings" element={<SettingsPage settings={settings} onSave={handleSaveSettings} showToast={showToast} />} />
                                        <Route path="/topic/:id" element={<TopicDetailView topics={topics} onDelete={handleDeleteTopic} />} />
                                        <Route path="/calendar" element={<CalendarPage topics={topics} />} />
                                        <Route path="/profile" element={<ProfilePage />} />
                                    </Routes>
                                </main>
                            </div>
                        </ProtectedRoute>
                    } />
                </Routes>
            </React.Suspense>
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    )
}

export default App;