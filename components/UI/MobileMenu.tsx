import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import McqPromoCard from '../McqPromoCard';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MobileMenuItemProps {
    to: string;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    subLabel?: string;
}

const MobileMenuItem: React.FC<MobileMenuItemProps> = ({ to, onClick, icon, label, subLabel }) => (
    <Link
        to={to}
        onClick={onClick}
        className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 text-gray-900 font-semibold hover:bg-gray-100 transition-colors"
    >
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            {icon}
        </div>
        <div className="flex-1">
            <div className="text-sm">{label}</div>
            {subLabel && <div className="text-xs text-gray-500 font-normal">{subLabel}</div>}
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </Link>
);

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] md:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl transform transition-transform duration-300 ease-out animate-in slide-in-from-bottom-full">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

                <div className="space-y-3">
                    <MobileMenuItem
                        to="/profile"
                        onClick={onClose}
                        label="Profile"
                        subLabel={currentUser?.email || ''}
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    />

                    <MobileMenuItem
                        to="/settings"
                        onClick={onClose}
                        label="Settings"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    />


                    {/* CTA / Upcoming Website */}
                    <div className="pt-2">
                        <McqPromoCard isCollapsed={false} />
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 py-4 bg-gray-100 rounded-2xl text-gray-900 font-bold text-sm tracking-wide hover:bg-gray-200 active:scale-95 transition-all duration-200"
                >
                    Close Menu
                </button>
            </div>
        </div>
    );
};

export default MobileMenu;
