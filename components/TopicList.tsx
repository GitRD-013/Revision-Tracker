import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Topic, RevisionStatus } from '../types';
import ConfirmModal from './UI/ConfirmModal';
import TopicActionMenu from './TopicActionMenu';
import CustomDropdown from './UI/CustomDropdown';

interface TopicListProps {
    topics: Topic[];
    onDelete: (id: string) => void;
    onDuplicate: (t: Topic) => void;
    onAddTopic: () => void;
    viewMode: 'grid' | 'table';
    onViewModeChange: (mode: 'grid' | 'table') => void;
}

const TopicList: React.FC<TopicListProps> = ({ topics, onDelete, onDuplicate, onAddTopic, viewMode, onViewModeChange }) => {
    const [searchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('All');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

    // Initialize from URL params if present
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed'>(
        (searchParams.get('status') as 'All' | 'Pending' | 'Completed') || 'All'
    );

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, topicId: string | null }>({ isOpen: false, topicId: null });



    const confirmDelete = () => {
        if (deleteModal.topicId) {
            onDelete(deleteModal.topicId);
        }
    };

    // Extract unique subjects for filter
    const validSubjects = useMemo(() => {
        const subs = new Set(topics.map(t => t.subject));
        return ['All', ...Array.from(subs)];
    }, [topics]);

    const filteredTopics = useMemo(() => {
        return topics.filter(topic => {
            const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                topic.subject.toLowerCase().includes(searchTerm.toLowerCase()); // Updated search to include subject
            const matchesSubject = selectedSubject === 'All' || topic.subject === selectedSubject;
            const matchesDifficulty = selectedDifficulty === 'All' || topic.difficulty === selectedDifficulty;

            let matchesStatus = true;
            const isCompleted = topic.revisions.every(r => r.status === RevisionStatus.COMPLETED);
            if (statusFilter === 'Pending') matchesStatus = !isCompleted;
            if (statusFilter === 'Completed') matchesStatus = isCompleted;

            return matchesSearch && matchesSubject && matchesDifficulty && matchesStatus;
        });
    }, [topics, searchTerm, selectedSubject, selectedDifficulty, statusFilter]); // Kept statusFilter in dependencies

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 overflow-x-hidden">
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, topicId: null })}
                onConfirm={confirmDelete}
                title="Delete Topic?"
                message="Are you sure you want to delete this topic? This action cannot be undone."
                isDestructive={true}
                confirmText="Delete"
            />

            {/* Header Section - On Canvas */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">My Topics</h2>
                    <p className="text-gray-500 mt-1">Manage and track your learning journey</p> {/* Original text restored */}
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded-xl border border-gray-200 flex items-center shadow-sm">
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Grid View"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </button>
                        <button
                            onClick={() => onViewModeChange('table')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Table View"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        </button>
                    </div>

                    <button onClick={onAddTopic} className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-xl shadow-soft hover:shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95 duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span className="hidden md:inline">Add Topic</span>
                    </button>
                </div>
            </div>

            {/* Filters Bar - Floating Strip (Updated with CustomDropdown) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full relative">
                    <input
                        type="text"
                        placeholder="Search topics..."
                        className="w-full pl-10 pr-4 py-3 bg-indigo-50/50 border-0 rounded-xl text-gray-900 focus:ring-2 focus:ring-primary transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <CustomDropdown
                        value={selectedSubject}
                        onChange={setSelectedSubject}
                        options={validSubjects}
                        placeholder="Filter by Subject"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>}
                    />

                    <CustomDropdown
                        value={selectedDifficulty}
                        onChange={setSelectedDifficulty}
                        options={['All', 'Easy', 'Medium', 'Hard']}
                        placeholder="Filter by Difficulty"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    />

                    <CustomDropdown
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value as 'All' | 'Pending' | 'Completed')}
                        options={['All', 'Pending', 'Completed']}
                        placeholder="Filter by Status"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                </div>
            </div>

            {/* Topics Grid - Cards on Canvas */}
            {filteredTopics.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
                    <p className="text-gray-500 font-medium text-lg">No topics found matching your filters.</p>
                    <button onClick={() => { setSearchTerm(''); setSelectedSubject('All'); setSelectedDifficulty('All'); setStatusFilter('All'); }} className="mt-4 text-primary font-bold hover:text-primary-dark transition-colors">Clear Filters</button>
                </div>
            ) : (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {filteredTopics.map(topic => {
                            const pendingRevs = topic.revisions.filter(r => r.status === RevisionStatus.PENDING);
                            const completedRevs = topic.revisions.filter(r => r.status === RevisionStatus.COMPLETED);

                            const nextDue = pendingRevs.length > 0
                                ? new Date(Math.min(...pendingRevs.map(r => new Date(r.date).getTime())))
                                : null;

                            const lastRevisedRev = [...completedRevs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                            const lastRevised = lastRevisedRev ? new Date(lastRevisedRev.date) : null;

                            const progress = Math.round((completedRevs.length / topic.revisions.length) * 100) || 0;

                            return (
                                <div key={topic.id} className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-medium hover:scale-[1.02] transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-2 flex-wrap">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 uppercase tracking-wide">
                                                {topic.subject}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${topic.difficulty === 'Easy' ? 'bg-green-50 text-green-600 border-green-100' :
                                                topic.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                    'bg-red-50 text-red-600 border-red-100'
                                                }`}>
                                                {topic.difficulty}
                                            </span>
                                        </div>
                                        <TopicActionMenu
                                            topicId={topic.id}
                                            onEdit={() => {/* handled by Link wrapper */ }}
                                            onDelete={() => setDeleteModal({ isOpen: true, topicId: topic.id })}
                                            onDuplicate={() => onDuplicate(topic)}
                                        />
                                    </div>

                                    <Link to={`/topic/${topic.id}`} className="block mb-5 flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                            {topic.title}
                                        </h3>
                                    </Link>

                                    {/* Progress  */}
                                    <div className="mb-5">
                                        <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                                            <span>Progress</span>
                                            <span className="text-gray-900 font-semibold">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Next Revision</span>
                                            <span className={`font-medium ${nextDue && nextDue < new Date() ? 'text-red-500' : 'text-gray-900'}`}>
                                                {nextDue ? nextDue.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Done'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Last Revised</span>
                                            <span className="text-gray-900 font-medium">
                                                {lastRevised ? lastRevised.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Table View */
                    /* Table View with Split Header/Body for Scrollbar separation */
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                {/* Header Table (Static) */}
                                <div className="bg-white">
                                    <table className="w-full text-left border-collapse table-fixed">
                                        <colgroup>
                                            <col className="w-[36%]" /> {/* Topic - Reduced slightly */}
                                            <col className="w-[12%]" /> {/* Subject */}
                                            <col className="w-[12%]" /> {/* Status */}
                                            <col className="w-[15%]" /> {/* Progress */}
                                            <col className="w-[15%]" /> {/* Next Due */}
                                            <col className="w-[10%]" /> {/* Actions - Increased for visibility */}
                                        </colgroup>
                                        <thead className="bg-white">
                                            <tr className="bg-indigo-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                <th className="px-6 py-4 truncate">Topic</th>
                                                <th className="px-6 py-4 truncate">Subject</th>
                                                <th className="px-6 py-4 truncate">Status</th>
                                                <th className="px-6 py-4 truncate">Progress</th>
                                                <th className="px-6 py-4 truncate">Next Due</th>
                                                <th className="px-2 py-4 text-center truncate">Actions</th>
                                            </tr>
                                        </thead>
                                    </table>
                                </div>

                                {/* Body Table (Scrollable Y) */}
                                <div className="overflow-y-auto max-h-[calc(100vh-280px)] lg:max-h-none lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                    <table className="w-full text-left border-collapse table-fixed">
                                        <colgroup>
                                            <col className="w-[36%]" /> {/* Topic */}
                                            <col className="w-[12%]" /> {/* Subject */}
                                            <col className="w-[12%]" /> {/* Status */}
                                            <col className="w-[15%]" /> {/* Progress */}
                                            <col className="w-[15%]" /> {/* Next Due */}
                                            <col className="w-[10%]" /> {/* Actions */}
                                        </colgroup>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredTopics.map(topic => {
                                                const pendingRevs = topic.revisions.filter(r => r.status === RevisionStatus.PENDING);
                                                const completedRevs = topic.revisions.filter(r => r.status === RevisionStatus.COMPLETED);
                                                const nextDue = pendingRevs.length > 0
                                                    ? new Date(Math.min(...pendingRevs.map(r => new Date(r.date).getTime())))
                                                    : null;
                                                const progress = Math.round((completedRevs.length / topic.revisions.length) * 100) || 0;

                                                return (
                                                    <tr key={topic.id} className="hover:bg-gray-50 transition-colors group">
                                                        <td className="px-6 py-4 truncate">
                                                            <Link to={`/topic/${topic.id}`} className="font-semibold text-gray-900 group-hover:text-primary transition-colors block max-w-xs truncate">
                                                                {topic.title}
                                                            </Link>
                                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border ${topic.difficulty === 'Easy' ? 'bg-green-50 text-green-600 border-green-100' :
                                                                topic.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                                    'bg-red-50 text-red-600 border-red-100'
                                                                }`}>
                                                                {topic.difficulty}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 truncate">
                                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                                                {topic.subject}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 truncate">
                                                            {completedRevs.length === topic.revisions.length ? (
                                                                <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
                                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Completed
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1.5 text-orange-500 text-xs font-bold">
                                                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div> Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 truncate">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-24 bg-gray-100 rounded-full h-1.5 shrink-0">
                                                                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-500">{progress}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm truncate">
                                                            <span className={`font-medium ${nextDue && nextDue < new Date() ? 'text-red-500' : 'text-gray-900'}`}>
                                                                {nextDue ? nextDue.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Done'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center truncate">
                                                            <div className="flex justify-center">
                                                                <TopicActionMenu
                                                                    topicId={topic.id}
                                                                    onEdit={() => {/* handled by Link wrapper */ }}
                                                                    onDelete={() => setDeleteModal({ isOpen: true, topicId: topic.id })}
                                                                    onDuplicate={() => onDuplicate(topic)}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default TopicList;
