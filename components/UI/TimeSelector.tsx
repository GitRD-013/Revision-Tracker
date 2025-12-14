import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TimeSelectorProps {
    value: string;
    onChange: (time: string) => void;
    label?: string;
    icon?: React.ReactNode;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ value, onChange, label, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    const timeOptions = [
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
        '20:00', '21:00', '22:00'
    ];

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

        const handleScroll = () => { if (isOpen) setIsOpen(false); };

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
            // Calculate best position (centered or left-aligned)
            // For time grid, we want it a bit wider than the trigger usually
            const width = Math.max(rect.width, 320);

            // Check if it goes off screen right
            let left = rect.left;
            if (left + width > window.innerWidth - 20) {
                left = window.innerWidth - width - 20;
            }

            setPosition({
                top: rect.bottom + 4,
                left: left,
                width: width
            });
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    const handleSelect = (time: string) => {
        onChange(time);
        setIsOpen(false);
    };

    // Group times by parts of day for better UX? Or just simple grid.
    // Simple grid is cleaner for this range.

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>}
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                className={`w-full bg-white border ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'} text-gray-900 text-sm rounded-xl p-3.5 flex items-center justify-between transition-all outline-none hover:bg-indigo-50/30`}
            >
                <div className="flex items-center gap-2">
                    {icon && <span className="text-gray-400 text-lg">{icon}</span>}
                    <span className={`${!value ? 'text-gray-400' : 'font-medium'}`}>
                        {value || 'Select Time'}
                    </span>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-white rounded-2xl shadow-xl border border-gray-100 z-[9999] p-4 animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        top: position.top,
                        left: position.left,
                        width: position.width,
                        maxWidth: '100%'
                    }}
                >
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">Select Reminder Time</div>

                    <div className="grid grid-cols-4 gap-2">
                        {timeOptions.map((time) => {
                            const isSelected = value === time;
                            // Add simple icon based on time?
                            const hour = parseInt(time.split(':')[0]);
                            const dayIcon = hour >= 6 && hour < 18 ? '☀️' : '🌙';

                            return (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => handleSelect(time)}
                                    className={`
                                        flex flex-col items-center justify-center p-2 rounded-xl border transition-all
                                        ${isSelected
                                            ? 'bg-primary text-white border-primary shadow-md transform scale-105'
                                            : 'bg-indigo-50 text-gray-700 border-transparent hover:bg-indigo-100 hover:border-indigo-200'}
                                    `}
                                >
                                    <span className="text-xs opacity-70 mb-0.5">{dayIcon}</span>
                                    <span className="font-bold text-sm">{time}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">Notifications will be sent daily at this time.</p>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TimeSelector;
