import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Topic } from '../../types';
import QuizSession from './QuizSession';

interface QuizWrapperProps {
    topics: Topic[];
}

const QuizWrapper: React.FC<QuizWrapperProps> = ({ topics }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const topic = topics.find(t => t.id === id);

    if (!topic) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-red-50 text-red-500 rounded-full p-6 mb-6">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Topic Not Found</h2>
                <p className="text-gray-500 mb-8">The topic you are looking for does not exist or has been deleted.</p>
                <button onClick={() => navigate('/topics')} className="px-6 py-3 bg-gray-100 font-bold text-gray-700 rounded-xl hover:bg-gray-200 transition">
                    Go to Topics
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="mb-6 flex items-center justify-start">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-primary transition font-bold text-sm">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
            </div>

            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Practice Session</h1>
                <p className="text-gray-500 text-lg">Testing your knowledge on <span className="text-primary font-bold">{topic.title}</span></p>
            </div>

            <QuizSession topic={topic} onClose={() => navigate('/topics')} />
        </div>
    );
};

export default QuizWrapper;
