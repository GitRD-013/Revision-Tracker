import React, { useMemo } from 'react';
import { Topic, RevisionStatus } from '../types';

interface WeeklyReportProps {
    topics: Topic[];
}

const WeeklyReport: React.FC<WeeklyReportProps> = ({ topics }) => {
    const { completed, missed, newTopics, suggestions } = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        let comp = 0;
        let miss = 0;
        const newT: string[] = [];

        topics.forEach(t => {
            // Check if topic was added this week
            if (new Date(t.addedDate) >= startOfWeek) {
                newT.push(t.title);
            }

            t.revisions.forEach(r => {
                const rDate = new Date(r.date);
                if (rDate >= startOfWeek && rDate <= new Date()) {
                    if (r.status === RevisionStatus.COMPLETED) comp++;
                    if (r.status === RevisionStatus.MISSED || (r.status === RevisionStatus.PENDING && r.date < new Date().toISOString().split('T')[0])) miss++;
                }
            });
        });

        const suggs = [];
        if (miss > 2) suggs.push("Try reducing your daily load or rescheduling missed items.");
        if (comp > 10) suggs.push("Great job! You're on fire this week.");
        if (newT.length === 0) suggs.push("Ready for a new challenge? Add a new topic!");

        return { completed: comp, missed: miss, newTopics: newT, suggestions: suggs };
    }, [topics]);

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl">📊</div>
                <h3 className="text-xl font-bold text-gray-900">Weekly Report</h3>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-2xl">
                        <div className="text-2xl font-bold text-green-600">{completed}</div>
                        <div className="text-xs font-bold text-green-800/60 uppercase tracking-wide">Topics Done</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-2xl">
                        <div className="text-2xl font-bold text-red-600">{missed}</div>
                        <div className="text-xs font-bold text-red-800/60 uppercase tracking-wide">Missed</div>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-gray-900 mb-2 text-sm">New Topics This Week</h4>
                    {newTopics.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {newTopics.map(t => <li key={t}>{t}</li>)}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-400 italic">No new topics added.</p>
                    )}
                </div>

                {suggestions.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-xl">
                        <h4 className="font-bold text-blue-900 mb-2 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            AI Suggestion
                        </h4>
                        <ul className="space-y-1">
                            {suggestions.map(s => (
                                <li key={s} className="text-sm text-blue-800">{s}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeeklyReport;
