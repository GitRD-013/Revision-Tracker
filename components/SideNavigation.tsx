import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import McqPromoCard from './McqPromoCard';

interface SideNavigationProps {
    isOpen: boolean;
    onCloseMobile: () => void;
    onHoverChange: (hover: boolean) => void;
    isExpanded: boolean;
}

const SideNavigation: React.FC<SideNavigationProps> = ({ isOpen, onCloseMobile, onHoverChange, isExpanded }) => {
    const location = useLocation();
    const { currentUser } = useAuth();

    // On mobile (isOpen), we always want to show the full content (expanded view logic)
    // On desktop, we rely on isExpanded
    const showExpanded = isOpen || isExpanded;

    const NavLink = ({ to, label, icon }: { to: string, label: string, icon: React.ReactNode }) => {
        const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
        return (
            <Link
                to={to}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-light hover:bg-gray-50 hover:text-text'
                    } ${!isExpanded ? 'md:justify-center md:p-0 md:w-12 md:h-12 md:mx-auto md:gap-0' : ''}`}
                title={!isExpanded ? label : undefined}
            >
                <div className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-current'}`}>
                    {icon}
                </div>
                <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[200px]' : 'md:opacity-0 md:max-w-0 opacity-100 max-w-[200px]'}`}>
                    {label}
                </span>
            </Link>
        )
    };

    const sidebarClasses = `
        fixed top-0 bottom-0 left-0 z-50 flex flex-col
        bg-white shadow-medium border-r border-gray-100
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isExpanded ? 'w-64' : 'w-64 md:w-20'} overflow-x-hidden
    `;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                    onClick={onCloseMobile}
                />
            )}

            <nav
                className={sidebarClasses}
                onMouseEnter={() => onHoverChange(true)}
                onMouseLeave={() => onHoverChange(false)}
            >
                {/* Logo */}
                <div
                    className={`flex items-center min-h-[89px] py-6 border-b border-gray-100 transition-all duration-300
                    justify-start px-6 ${!isExpanded ? 'md:justify-center md:px-4' : ''} cursor-pointer`}
                    onClick={() => {
                        // Tablet Touch Logic: Toggle on tap if device doesn't support hover
                        if (window.matchMedia('(hover: none)').matches) {
                            onHoverChange(!isExpanded);
                        }
                    }}
                >
                    <div className={`flex items-center ${isExpanded ? 'gap-3' : 'gap-3 md:gap-0'}`}>
                        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
                        </div>
                        <span className={`font-bold text-lg text-text transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[200px]' : 'md:opacity-0 md:max-w-0 opacity-100 max-w-[200px]'}`}>
                            DiggiClass
                        </span>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden scrollbar-hide px-3 py-4">
                    <NavLink
                        to="/"
                        label="Dashboard"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                    />
                    <NavLink
                        to="/topics"
                        label="Topics"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                    />
                    <NavLink
                        to="/calendar"
                        label="Calendar"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    />
                    <NavLink
                        to="/settings"
                        label="Settings"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    />

                    <McqPromoCard isCollapsed={!showExpanded} />
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-gray-100">
                    <Link
                        to="/profile"
                        onClick={onCloseMobile}
                        className={`flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group ${!showExpanded ? 'justify-center' : ''}`}
                        title="My Profile"
                    >
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${showExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
                            <p className="text-sm font-bold text-gray-900 truncate">{currentUser?.displayName || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                        </div>
                    </Link>
                </div>
            </nav>
        </>
    );
};

export default SideNavigation;
