import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Option {
    value: string;
    label: string;
    hex?: string;
}

interface CustomDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: (string | Option)[];
    placeholder?: string;
    label?: string;
    icon?: React.ReactNode;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ value, onChange, options, placeholder, label, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    // Normalize options
    const normalizedOptions: Option[] = options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    const selectedLabel = normalizedOptions.find(opt => opt.value === value)?.label || value;

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
                className={`w-full bg-white border ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'} text-gray-900 text-sm rounded-xl p-3.5 flex items-center justify-between transition-all outline-none`}
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && <span className="text-gray-400">{icon}</span>}
                    <span className={`${!value ? 'text-gray-400' : ''}`}>
                        {value ? selectedLabel : (placeholder || 'Select...')}
                    </span>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-white rounded-xl shadow-xl border border-gray-100 z-[9999] animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                    style={{
                        top: position.top,
                        left: position.left,
                        minWidth: position.width,
                        maxHeight: '280px'
                    }}
                >
                    <div className="overflow-y-auto max-h-[280px] py-1">
                        {normalizedOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-indigo-50 transition-colors ${value === opt.value ? 'bg-primary/5 text-primary font-medium' : 'text-gray-700'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {opt.hex && (
                                        <div
                                            className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                                            style={{ backgroundColor: opt.hex }}
                                        />
                                    )}
                                    <span>{opt.label}</span>
                                </div>
                                {value === opt.value && (
                                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CustomDropdown;
