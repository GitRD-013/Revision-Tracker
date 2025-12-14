import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Topic } from '../../types';

interface PracticeHubProps {
    topics: Topic[];
}

const PracticeHub: React.FC<PracticeHubProps> = ({ topics }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('All');

    const subjects = useMemo(() => {
        const subs = new Set(topics.map(t => t.subject));
        return ['All', ...Array.from(subs)];
    }, [topics]);

    const filteredTopics = useMemo(() => {
        return topics.filter(topic => {
            const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSubject = selectedSubject === 'All' || topic.subject === selectedSubject;
            return matchesSearch && matchesSubject;
        });
    }, [topics, searchTerm, selectedSubject]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-gray-900">Practice Arena</h1>
                <p className="text-gray-500 mt-2 text-lg">Test your knowledge with AI-generated quizzes</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search topics to practice..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border-0 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary transition-all"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary cursor-pointer min-w-[150px]"
                >
                    {subjects.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
                </select>
            </div>

            {/* Grid */}
            {filteredTopics.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-soft">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🧠</div>
                    <p className="text-gray-500 font-medium text-lg">No topics found for practice.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTopics.map(topic => (
                        <Link to={`/quiz/${topic.id}`} key={topic.id} className="bg-white rounded-[2rem] p-6 shadow-soft group hover:-translate-y-1 transition-all border border-transparent hover:border-purple-100">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">{topic.subject}</span>
                                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{topic.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>5 Questions</span>
                                <span>•</span>
                                <span>{topic.difficulty}</span>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-50 text-center">
                                <span className="text-purple-600 font-bold group-hover:underline">Start Quiz</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PracticeHub;
