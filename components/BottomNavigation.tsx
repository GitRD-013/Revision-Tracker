import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MobileMenu from './UI/MobileMenu';

const BottomNavigation = () => {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const NavItem = ({ to, icon, activeIcon, label, isActive }: { to?: string, icon: React.ReactNode, activeIcon: React.ReactNode, label: string, isActive: boolean }) => {
        const content = (
            <div className={`flex items-center justify-center transition-all duration-300 ease-in-out ${isActive
                ? 'bg-primary/10 text-primary px-4 py-2 rounded-full gap-2'
                : 'text-gray-400 p-2'}`}
            >
                <div className={`w-6 h-6 flex items-center justify-center shrink-0`}>
                    {isActive ? activeIcon : icon}
                </div>

                {/* overflow-hidden wrapper for smooth width transition could be added, but simple conditional with CSS transition works for now */}
                <span className={`text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ${isActive ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0'}`}>
                    {isActive ? label : ''}
                </span>
            </div>
        );

        // Wrapper to center the pill in the flex space
        const wrapperClass = "flex-1 flex items-center justify-center py-2";

        if (to) {
            return (
                <Link to={to} className={wrapperClass}>
                    {content}
                </Link>
            );
        }

        return (
            <button onClick={() => setIsMenuOpen(true)} className={wrapperClass}>
                {content}
            </button>
        );
    };

    const isPathActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-white rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] border-t border-gray-100 flex items-center justify-around px-2 z-50 lg:hidden backdrop-blur-md bg-white/90 supports-[backdrop-filter]:bg-white/60">
                <NavItem
                    to="/"
                    label="Dashboard"
                    isActive={isPathActive('/')}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                    activeIcon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 0a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2h-4zm0 12a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2h-4zM4 16a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2H4z" /></svg>}
                />
                <NavItem
                    to="/topics"
                    label="Topics"
                    isActive={isPathActive('/topics')}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                    activeIcon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12.75 5.666a7.75 7.75 0 0 1 7.125-.194A2.25 2.25 0 0 1 21.75 7.5v11.1c0 1.285-1.42 2.062-2.525 1.488a9.25 9.25 0 0 0-6.475-.724V5.666ZM3.626 5.472A7.75 7.75 0 0 1 11.25 5.667v13.697a9.25 9.25 0 0 0-6.475.724c-1.104.574-2.525-.203-2.525-1.488V7.5a2.25 2.25 0 0 1 1.375-2.028Z" /></svg>}
                />
                <NavItem
                    to="/calendar"
                    label="Calendar"
                    isActive={isPathActive('/calendar')}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    activeIcon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" /><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" /></svg>}
                />
                <NavItem
                    label="Menu"
                    isActive={isMenuOpen}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>}
                    activeIcon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>}
                />
            </div>

            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
};

export default BottomNavigation;
