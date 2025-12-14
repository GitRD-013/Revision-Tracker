import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CustomTimePickerProps {
    value: string; // HH:mm (24h)
    onChange: (value: string) => void;
    label?: string;
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    // Parse current value
    const [currentHour, currentMinute] = (value || '09:00').split(':').map(Number);
    const initialMeridiem = currentHour >= 12 ? 'PM' : 'AM';
    const [meridiem, setMeridiem] = useState<'AM' | 'PM'>(initialMeridiem);

    // Sync internal meridiem when value changes externally
    useEffect(() => {
        setMeridiem(currentHour >= 12 ? 'PM' : 'AM');
    }, [currentHour]);


    // Generate 12-hour time slots (12:00 to 11:30)
    const timeSlots = [];
    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    for (const h of hours) {
        timeSlots.push({ hour: h, minute: '00' });
        timeSlots.push({ hour: h, minute: '30' });
    }



    const handleSelectTime = (h: number, m: string) => {
        let hour24 = h;
        if (meridiem === 'PM' && h !== 12) hour24 += 12;
        if (meridiem === 'AM' && h === 12) hour24 = 0;

        onChange(`${String(hour24).padStart(2, '0')}:${m}`);
        setIsOpen(false);
    };

    const toggleMeridiem = (newMeridiem: 'AM' | 'PM') => {
        setMeridiem(newMeridiem);
    };

    // Calculate display value
    const displayHour = currentHour % 12 || 12;
    const displayMinute = String(currentMinute).padStart(2, '0');
    const displayMeridiem = currentHour >= 12 ? 'PM' : 'AM';


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleScroll = (event: Event) => {
            if (
                dropdownRef.current &&
                (event.target === dropdownRef.current || dropdownRef.current.contains(event.target as Node))
            ) {
                return;
            }
            if (isOpen) setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    const handleToggle = () => {
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width
            });
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>}
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                className={`w-full bg-white border ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'} text-gray-900 text-sm rounded-2xl p-3.5 flex items-center justify-between transition-all outline-none`}
            >
                <div className="flex items-center gap-2">
                    <span className="font-medium text-lg text-gray-700">
                        {String(displayHour).padStart(2, '0')}:{displayMinute}
                    </span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${displayMeridiem === 'AM' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {displayMeridiem}
                    </span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-white rounded-xl shadow-xl border border-gray-100 z-[9999] animate-in fade-in zoom-in-95 duration-100 flex flex-col overflow-hidden"
                    style={{
                        top: position.top,
                        left: position.left,
                        width: '180px', // Fixed width for cleaner look as per list UI logic
                        maxHeight: '320px'
                    }}
                >
                    {/* Header with AM/PM Toggle */}
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Time</span>
                        <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleMeridiem('AM'); }}
                                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${meridiem === 'AM'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                AM
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleMeridiem('PM'); }}
                                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${meridiem === 'PM'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                PM
                            </button>
                        </div>
                    </div>

                    {/* Time List */}
                    <div className="overflow-y-auto py-1 flex-1">
                        {timeSlots.map((slot) => {
                            const isSelected =
                                displayMeridiem === meridiem &&
                                displayHour === slot.hour &&
                                displayMinute === slot.minute;

                            return (
                                <button
                                    key={`${slot.hour}-${slot.minute}`}
                                    type="button"
                                    onClick={() => handleSelectTime(slot.hour, slot.minute)}
                                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${isSelected ? 'text-primary font-bold bg-primary/5' : 'text-gray-700'
                                        }`}
                                >
                                    <span>{String(slot.hour).padStart(2, '0')}:{slot.minute}</span>
                                    {isSelected && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CustomTimePicker;
