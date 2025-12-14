import React from 'react';

interface McqPromoCardProps {
    isCollapsed?: boolean;
}

const McqPromoCard: React.FC<McqPromoCardProps> = ({ isCollapsed }) => {
    return (
        <div
            className={`
                relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm mt-auto mb-2 transition-all duration-500 ease-in-out group
                ${isCollapsed
                    ? 'opacity-0 translate-y-8 max-h-0 py-0 px-0 mx-0 border-0 pointer-events-none'
                    : 'opacity-100 translate-y-0 max-h-[500px] py-4 px-4 mx-3 pointer-events-auto'
                }
            `}
        >
            <div className={`relative z-10 flex flex-col items-start gap-3 transition-opacity duration-300 delay-100 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-indigo-100 p-1.5 text-indigo-600">
                        <span className="text-lg">🎓</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide bg-indigo-100 px-2 py-0.5 rounded-full">New</span>
                </div>

                <div>
                    <h3 className="mb-0.5 text-sm font-bold leading-tight text-gray-900">
                        AI Mock Tests
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                        Exam-ready practice questions.
                    </p>
                </div>

                <a
                    href="#" // TODO: Add your MCQ Mock Test Website URL here
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 text-xs font-semibold transition-all shadow-sm hover:shadow-md"
                >
                    Coming Soon
                </a>
            </div>

            {/* Decorative Background Elements */}
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-50 blur-xl transition-opacity duration-500 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}></div>
            <div className={`absolute -bottom-6 -right-2 h-20 w-20 rounded-full bg-purple-50 blur-lg transition-opacity duration-500 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}></div>
        </div>
    );
};

export default McqPromoCard;
