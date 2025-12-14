import React, { useEffect, useMemo } from 'react';
import { Topic, Revision, RevisionStatus } from '../types';

interface RightSidebarProps {
    topics: Topic[];
    onReschedule: (topicId: string, revisionId: string, newDate: string) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ topics, onReschedule }) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];


    // --- Revisions Logic ---
    const allRevisions = useMemo(() => {
        const revs: { topicTitle: string; topicId: string; revision: Revision }[] = [];
        topics.forEach(topic => {
            topic.revisions.forEach(rev => {
                if (rev.status === RevisionStatus.PENDING || rev.status === RevisionStatus.MISSED) {
                    revs.push({ topicTitle: topic.title, topicId: topic.id, revision: rev });
                }
            });
        });
        // Sort by date
        return revs.sort((a, b) => a.revision.date.localeCompare(b.revision.date));
    }, [topics]);

    const upcomingRevisions = allRevisions.filter(r => r.revision.date >= todayStr).slice(0, 5);

    // --- Missed Revisions Auto-Reschedule ---
    useEffect(() => {
        const missedRevisions = allRevisions.filter(r => r.revision.date < todayStr && r.revision.status !== RevisionStatus.COMPLETED);

        if (missedRevisions.length > 0) {
            console.log("Found missed revisions, rescheduling...", missedRevisions);
            missedRevisions.forEach(item => {
                onReschedule(item.topicId, item.revision.id, todayStr);
            });
        }
    }, [allRevisions, todayStr, onReschedule]);

    return (
        <aside className="hidden xl:flex flex-col w-80 fixed top-0 bottom-0 right-0 bg-white border-l border-gray-100 shadow-soft p-6 overflow-y-auto no-scrollbar z-40">
            {/* Upcoming Revisions */}
            <div className="flex-1">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="font-semibold text-base text-text">Upcoming</h3>
                    <button className="text-xs text-primary font-medium hover:text-primary-dark transition-colors">View All</button>
                </div>

                <div className="space-y-3">
                    {upcomingRevisions.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            <p className="text-text-muted text-sm">No upcoming revisions</p>
                        </div>
                    ) : (
                        upcomingRevisions.map((item) => (
                            <div key={`${item.topicId}-${item.revision.id}`} className="bg-gray-50 p-3 rounded-xl flex items-center gap-3 hover:bg-gray-100 transition-colors group cursor-pointer">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                    {new Date(item.revision.date).getDate()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-text text-sm truncate">{item.topicTitle}</h4>
                                    <p className="text-xs text-text-muted">{new Date(item.revision.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                                <div className={`w-2 h-2 rounded-full shrink-0 ${item.revision.date === todayStr ? 'bg-success' : 'bg-gray-300'
                                    }`}></div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </aside>
    );
};

export default RightSidebar;
