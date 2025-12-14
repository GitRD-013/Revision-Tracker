import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Topic, RevisionStatus } from '../types';
import ConfirmModal from './UI/ConfirmModal';

interface TopicDetailViewProps {
    topics: Topic[];
    onDelete?: (id: string) => void;
}

const TopicDetailView: React.FC<TopicDetailViewProps> = ({ topics, onDelete }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const topic = topics.find(t => t.id === id);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    if (!topic) {
        return (
            <div className="max-w-[1600px] mx-auto px-6 py-8 text-center">
                <h2 className="text-2xl font-bold text-gray-700">Topic not found</h2>
                <Link to="/topics" className="text-primary hover:underline mt-4 inline-block">Back to Topics</Link>
            </div>
        );
    }

    const handleDelete = () => {
        if (onDelete && topic) {
            onDelete(topic.id);
            navigate('/topics');
        }
    };

    const completedRevs = topic.revisions.filter(r => r.status === RevisionStatus.COMPLETED);
    const progress = Math.round((completedRevs.length / topic.revisions.length) * 100) || 0;

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Topic?"
                message="Are you sure you want to delete this topic? This action cannot be undone."
                isDestructive={true}
                confirmText="Delete"
            />

            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    to="/topics"
                    className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95"
                    title="Back to Topics"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link to="/topics" className="hover:text-primary transition-colors">My Topics</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium truncate max-w-xs">{topic.title}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Title, Info, Notes */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-medium transition-shadow duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{topic.title}</h1>
                                <div className="flex gap-3 flex-wrap">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                        {topic.subject}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${topic.difficulty === 'Easy' ? 'bg-green-50 text-green-600 border-green-100' :
                                        topic.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                            'bg-red-50 text-red-600 border-red-100'
                                        }`}>
                                        {topic.difficulty}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    to={`/edit/${topic.id}`}
                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95"
                                    title="Edit Topic"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </Link>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                                    title="Delete Topic"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="prose prose-sm max-w-none text-gray-600">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Notes</h3>
                            {topic.notes ? (
                                <div dangerouslySetInnerHTML={{ __html: topic.notes }} />
                            ) : (
                                <p className="text-gray-400 italic">No notes added for this topic.</p>
                            )}
                        </div>
                    </div>


                </div>

                {/* Sidebar: Progress & Revision Schedule */}
                <div className="space-y-6">
                    {/* Progress Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Completion Status</h3>
                        <div className="relative w-32 h-32 mx-auto my-6 flex items-center justify-center">
                            {/* Circular Progress Placeholder - CSS Conic Gradient */}
                            <div className="w-full h-full rounded-full" style={{
                                background: `conic-gradient(#4F46E5 ${progress}%, #F3F4F6 ${progress}% 100%)`,
                                maskImage: 'radial-gradient(transparent 60%, black 61%)',
                                WebkitMaskImage: 'radial-gradient(transparent 60%, black 61%)'
                            }}></div>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-2xl font-bold text-gray-900">{progress}%</span>
                                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Done</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center border-t border-gray-50 pt-4">
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{completedRevs.length}</div>
                                <div className="text-xs text-gray-400 font-medium">Completed</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{topic.revisions.length}</div>
                                <div className="text-xs text-gray-400 font-medium">Total Sessions</div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Revisions */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Revision Schedule</h3>
                        <div className="space-y-4">
                            {topic.revisions.map((rev, index) => {
                                const isPast = new Date(rev.date).getTime() < new Date().getTime();
                                const isCompleted = rev.status === RevisionStatus.COMPLETED;

                                return (
                                    <div key={rev.id} className="flex items-center gap-4 group cursor-default">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`w-0.5 h-full ${index === 0 ? 'bg-transparent' : 'bg-gray-100'}`}></div>
                                            <div className={`w-3 h-3 rounded-full border-2 ${isCompleted ? 'bg-green-500 border-green-500' :
                                                isPast ? 'bg-red-50 border-red-200' :
                                                    'bg-white border-gray-300'
                                                }`}></div>
                                            <div className={`w-0.5 h-full ${index === topic.revisions.length - 1 ? 'bg-transparent' : 'bg-gray-100'}`}></div>
                                        </div>
                                        <div className={`flex-1 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-sm ${isCompleted ? 'bg-green-50/50 border-green-100' :
                                            isPast ? 'bg-red-50/30 border-red-50' :
                                                'bg-gray-50 border-transparent hover:border-gray-100'
                                            }`}>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-sm font-bold ${isCompleted ? 'text-green-700' :
                                                    isPast ? 'text-red-700' :
                                                        'text-gray-700'
                                                    }`}>
                                                    Revision {index + 1}
                                                </span>
                                                <span className="text-xs text-gray-500 font-medium">{rev.date}</span>
                                            </div>
                                            <div className="mt-1 flex justify-between items-center">
                                                <span className="text-xs uppercase font-bold tracking-wide text-gray-400">{rev.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopicDetailView;
