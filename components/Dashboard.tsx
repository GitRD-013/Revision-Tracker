import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Topic, RevisionStatus } from '../types';
import WeeklyReport from './WeeklyReport';
import HeatmapCalendar from './HeatmapCalendar';
import UpcomingTopics from './UpcomingTopics';

interface DashboardProps {
    topics: Topic[];
    onStatusUpdate: (id: string, revId: string, status: RevisionStatus) => void;
    onAddTopic: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ topics, onStatusUpdate, onAddTopic }) => {
    const today = new Date().toISOString().split('T')[0];

    // Combine logic for stats and revisions
    const { dueToday, stats, completionRate } = useMemo(() => {
        const todayRevs: { topicId: string; revId: string; date: string }[] = [];
        let completedRevisions = 0;
        let totalRevisions = 0;

        topics.forEach(topic => {
            topic.revisions.forEach(rev => {
                totalRevisions++;
                if (rev.status === RevisionStatus.COMPLETED) {
                    completedRevisions++;
                } else {
                    // Include both today's and missed/overdue revisions
                    if (rev.date <= today) {
                        todayRevs.push({ topicId: topic.id, revId: rev.id, date: rev.date });
                    }
                }
            });
        });

        // Sort by date (oldest first for overdue)
        todayRevs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const rate = totalRevisions > 0 ? Math.round((completedRevisions / totalRevisions) * 100) : 0;

        return {
            dueToday: todayRevs,
            stats: {
                totalTopics: topics.length,
                totalRevisions,
                completedRevisions,
                pendingRevisions: totalRevisions - completedRevisions
            },
            completionRate: rate
        };
    }, [topics, today]);

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-500 mt-1"> Overview of your learning progress</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400 font-medium hidden md:block">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <button onClick={onAddTopic} className="bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-6 rounded-xl shadow-soft hover:shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95 duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Topic
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/topics" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-medium hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110"></div>
                    {/* Revisions Count removed as per user request */}

                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Total Topics</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.totalTopics}</h3>
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                </Link>

                <Link to="/topics?status=Completed" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-medium hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110"></div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Completed Revisions</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.completedRevisions}</h3>
                    </div>
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </Link>

                <Link to="/topics?status=Pending" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-medium hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100 rounded-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110"></div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Pending Revisions</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.pendingRevisions}</h3>
                    </div>
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </Link>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-medium hover:scale-[1.02] transition-all duration-300 cursor-default">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110"></div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Completion Rate</p>
                        <h3 className="text-3xl font-bold text-gray-900">{completionRate}%</h3>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Tasks & Heatmap */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Tasks Due Today */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col hover:shadow-soft transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Priority Tasks</h3>
                                <p className="text-sm text-gray-400 mt-1">Revisions scheduled for today</p>
                            </div>
                            <span className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap shrink-0">
                                {dueToday.length} Due
                            </span>
                        </div>

                        {dueToday.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 border-dashed animate-fade-in">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-2xl animate-bounce">🎉</div>
                                <h4 className="text-gray-900 font-semibold">All Caught Up!</h4>
                                <p className="text-gray-400 text-sm mt-1">No revisions due today. Great job!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {dueToday.map((item) => {
                                    const topic = topics.find(t => t.id === item.topicId);
                                    if (!topic) return null;
                                    const isMissed = item.date < today;

                                    return (
                                        <div key={`${item.topicId}-${item.revId}`}
                                            className="flex items-center gap-4 p-4 rounded-xl hover:bg-indigo-50/50 transition-all duration-200 border border-gray-100 group hover:shadow-sm hover:scale-[1.01] bg-white cursor-pointer"
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${isMissed ? 'bg-red-50 text-red-500' : 'bg-primary/5 text-primary'}`}>
                                                {isMissed ? '!' : '📝'}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{topic.subject}</span>
                                                    {isMissed && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">OVERDUE</span>}
                                                </div>
                                                <h4 className="font-semibold text-gray-900 truncate">{topic.title}</h4>
                                            </div>

                                            <button
                                                onClick={() => onStatusUpdate(topic.id, item.revId, RevisionStatus.COMPLETED)}
                                                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-success hover:text-white text-gray-400 flex items-center justify-center transition-all shadow-sm"
                                                title="Mark as Done"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Heatmap Calendar */}
                    <HeatmapCalendar topics={topics} />
                </div>

                {/* Right Column: Progress & Upcoming */}
                <div className="space-y-8">
                    <WeeklyReport topics={topics} />
                    <UpcomingTopics topics={topics} />
                </div>

            </div>
        </div>
    );
};

export default Dashboard;