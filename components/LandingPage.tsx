import React, { useRef } from 'react';

interface LandingPageProps {
    onLaunch: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Mock dashboard preview component
    const DashboardPreview = () => (
        <div className="w-full h-full bg-slate-50 p-4 overflow-hidden pointer-events-none select-none relative">
            {/* Header Mock */}
            <div className="mb-6">
                <div className="h-6 w-32 bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-4 w-48 bg-gray-100 rounded-lg"></div>
            </div>

            {/* Cards Row Mock */}
            <div className="flex gap-4 mb-6">
                <div className="w-1/2 h-24 bg-gradient-to-br from-pink-300 to-primary rounded-2xl shadow-sm"></div>
                <div className="w-1/2 h-24 bg-white rounded-2xl shadow-sm border border-gray-100"></div>
            </div>

            {/* Content Mock */}
            <div className="flex gap-4 h-full">
                <div className="w-2/3 bg-white rounded-2xl shadow-sm h-48 border border-gray-100"></div>
                <div className="w-1/3 bg-white rounded-2xl shadow-sm h-48 border border-gray-100 px-3 py-4 space-y-3">
                    <div className="w-full h-8 bg-gray-50 rounded-xl"></div>
                    <div className="w-full h-8 bg-gray-50 rounded-xl"></div>
                    <div className="w-full h-8 bg-gray-50 rounded-xl"></div>
                </div>
            </div>

            {/* Overlay to simulate depth/glass */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDF2F8] overflow-hidden font-sans selection:bg-pink-200">
            {/* Soft Gradient Background Mesh */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-200/40 rounded-full blur-[120px] mix-blend-multiply animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[50%] h-[60%] bg-purple-200/40 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] bg-orange-100/40 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 h-screen flex flex-col justify-center items-center">

                {/* Header Text */}
                <div className="mb-12 text-center space-y-2 opacity-0 animate-in fade-in slide-in-from-top-8 duration-700">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                        DiggiClass
                    </h1>
                    <p className="text-gray-500 font-medium text-lg">Your Personal Learning Companion</p>
                </div>

                {/* Horizontal Scroll Snap Container */}
                <div
                    ref={scrollContainerRef}
                    className="w-full max-w-[95vw] md:max-w-6xl overflow-x-auto snap-x snap-mandatory flex gap-6 md:gap-12 px-6 md:px-[calc(50vw-220px)] pb-12 pt-4 no-scrollbar items-center"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {/* Card 1: Intro */}
                    <div className="snap-center shrink-0 w-[300px] md:w-[380px] h-[500px] bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-500">
                        <div>
                            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-gray-200">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-4">Revision<br />Simplicity.</h2>
                            <p className="text-gray-500 leading-relaxed font-medium">
                                Track your topics, schedule revisions, and test your knowledge with AI—all in one beautiful space.
                            </p>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <div className="h-2 w-16 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>

                    {/* Card 2: The Launcher (Main App Preview) */}
                    <div
                        onClick={onLaunch}
                        className="cursor-pointer snap-center shrink-0 w-[300px] md:w-[380px] h-[500px] bg-white rounded-[2.5rem] shadow-[0_30px_80px_-20px_rgba(236,72,153,0.3)] p-3 relative group hover:scale-[1.03] transition-all duration-500 ring-4 ring-white/50"
                    >
                        <div className="absolute -top-4 -right-4 bg-primary text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-20 animate-bounce">
                            Launch App
                        </div>

                        {/* Container for the preview */}
                        <div className="w-full h-full bg-gray-50 rounded-[2rem] overflow-hidden relative border border-gray-100 group-hover:shadow-inner transition-shadow">
                            <DashboardPreview />

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
                                <div className="w-16 h-16 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300">
                                    <svg className="w-6 h-6 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Placeholder / Coming Soon */}
                    <div className="snap-center shrink-0 w-[300px] md:w-[380px] h-[500px] bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-dashed border-white flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform duration-500">
                        <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-6 text-gray-400">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Detailed Analytics</h3>
                        <p className="text-gray-500 text-sm">Coming Soon</p>
                    </div>

                    {/* Card 4: Placeholder */}
                    <div className="snap-center shrink-0 w-[80px] md:w-[100px] h-[500px] flex items-center justify-center opacity-50">
                        <div className="w-full h-[80%] border-l-2 border-dashed border-gray-300/50"></div>
                    </div>
                </div>

                {/* Footer Navigation Hints */}
                <div className="mt-8 flex items-center gap-4 opacity-50">
                    <div className="w-2 h-2 rounded-full bg-gray-900/40"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400/40"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400/40"></div>
                    <span className="text-xs font-medium text-gray-500 ml-2">Scroll to explore</span>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
