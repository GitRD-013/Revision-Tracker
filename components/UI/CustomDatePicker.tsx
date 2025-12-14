import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface CustomDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date(value || new Date()));
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    useEffect(() => {
        if (value) setViewDate(new Date(value));
        else setViewDate(new Date());
    }, [value, isOpen]);

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
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    const handleToggle = () => {
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    const handleSelectDate = (day: number) => {
        const year = viewDate.getFullYear();
        const month = String(viewDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        onChange(`${year}-${month}-${d}`);
        setIsOpen(false);
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysCount = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const days = [];

        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
        }

        for (let i = 1; i <= daysCount; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isSelected = value === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectDate(i)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all
                        ${isSelected ? 'bg-primary text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}
                        ${isToday && !isSelected ? 'text-primary font-bold bg-primary/10' : ''}
                    `}
                >
                    {i}
                </button>
            );
        }
        return days;
    };

    return (
        <div>
            {label && <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>}
            <div
                ref={triggerRef}
                onClick={handleToggle}
                className={`w-full bg-white border ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'} text-gray-900 text-sm rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all hover:bg-gray-50`}
            >
                <div className="flex items-center gap-2">
                    <span className={`${!value ? 'text-gray-400' : ''}`}>
                        {value ? new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Select Date'}
                    </span>
                </div>
                <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
            </div>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-white rounded-2xl shadow-xl border border-gray-100 z-[9999] p-4 text-center w-[320px] animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: position.top, left: position.left }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="font-bold text-gray-900 text-lg">
                            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-xs font-bold text-gray-400 uppercase w-9 text-center">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 place-items-center">
                        {renderCalendar()}
                    </div>

                    <button
                        type="button"
                        onClick={() => { onChange(new Date().toISOString().split('T')[0]); setIsOpen(false); }}
                        className="mt-4 text-sm font-semibold text-primary hover:bg-primary/5 w-full py-2 rounded-xl transition-colors"
                    >
                        Today
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CustomDatePicker;
