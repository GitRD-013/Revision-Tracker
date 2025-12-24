import React, { useMemo } from 'react';
import { Topic, RevisionStatus } from '../types';
import { Link } from 'react-router-dom';

interface UpcomingTopicsProps {
    topics: Topic[];
}

const UpcomingTopics: React.FC<UpcomingTopicsProps> = ({ topics }) => {
    const upcoming = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const nextRevisions: { topicId: string; title: string; subject: string; date: string; daysLeft: number }[] = [];

        topics.forEach(t => {
            // Find earliest PENDING revision in the future
            const futureRevs = t.revisions.filter(r => r.status === RevisionStatus.PENDING && r.date > today);
            if (futureRevs.length > 0) {
                // Sort by date to find nearest
                futureRevs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const nextRev = futureRevs[0];

                const diffTime = Math.abs(new Date(nextRev.date).getTime() - new Date(today).getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                nextRevisions.push({
                    topicId: t.id,
                    title: t.title,
                    subject: t.subject,
                    date: nextRev.date,
                    daysLeft: diffDays
                });
            }
        });

        // Sort all by date
        return nextRevisions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);
    }, [topics]);

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center text-xl">⏳</div>
                <h3 className="text-xl font-bold text-gray-900">Upcoming</h3>
            </div>

            {upcoming.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                    No upcoming revisions scheduled.
                </div>
            ) : (
                <div className="space-y-4">
                    {upcoming.map(item => (
                        <div key={item.topicId} className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                                <span className="text-lg text-gray-900">{new Date(item.date).getDate()}</span>
                                <span className="text-[10px] uppercase">{new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <Link to={`/topic/${item.topicId}`} className="block font-semibold text-gray-900 truncate hover:text-primary transition-colors">
                                    {item.title}
                                </Link>
                                <div className="text-xs text-gray-400 font-medium">
                                    {item.subject} • In {item.daysLeft} days
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {upcoming.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                    <Link to="/calendar" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                        View Calendar
                    </Link>
                </div>
            )}
        </div>
    );
};

export default UpcomingTopics;
