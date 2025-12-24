import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

interface TopicActionMenuProps {
    topicId: string;
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

const TopicActionMenu: React.FC<TopicActionMenuProps> = ({ topicId, onDelete, onDuplicate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top?: number | undefined, bottom?: number | undefined, left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleScroll = () => {
            if (isOpen) setIsOpen(false); // Close on scroll to avoid position drift
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

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Align right edge of menu with right edge of button
            // Menu width is 9rem (w-36) = 144px
            const left = rect.right - 144;

            // Check vertical space
            const spaceBelow = window.innerHeight - rect.bottom;
            const minSpaceRequired = 220; // Approx menu height + padding

            if (spaceBelow < minSpaceRequired) {
                // Open upwards
                setDropdownPos({
                    bottom: window.innerHeight - rect.top + 4,
                    left: left,
                    top: undefined
                });
            } else {
                // Open downwards (default)
                setDropdownPos({
                    top: rect.bottom + 4,
                    left: left,
                    bottom: undefined
                });
            }
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-[9999] py-1 transition-all"
                    style={{
                        left: dropdownPos.left,
                        top: dropdownPos.top ?? 'auto',
                        bottom: dropdownPos.bottom ?? 'auto'
                    }}
                >
                    <Link
                        to={`/edit/${topicId}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                        onClick={() => setIsOpen(false)}
                    >
                        Edit
                    </Link>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDuplicate();
                            setIsOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                    >
                        Duplicate
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete();
                            setIsOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                        Delete
                    </button>
                </div>,
                document.body
            )}
        </>
    );
};

export default TopicActionMenu;
