import React, { useState, useEffect } from 'react';
import { Topic, MCQQuestion } from '../../types';
import { generateQuiz } from '../../services/geminiService';
import QuizCard from './QuizCard';
import Skeleton from '../UI/Skeleton';
import { saveQuizResult, QuizResult } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';

interface QuizSessionProps {
    topic: Topic;
    onClose: () => void;
}

const QuizSession: React.FC<QuizSessionProps> = ({ topic, onClose }) => {
    const { currentUser } = useAuth();
    const [questions, setQuestions] = useState<MCQQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [startTime] = useState<number>(Date.now());
    const [userAnswers, setUserAnswers] = useState<{ questionId: string; selectedAnswer: string; isCorrect: boolean }[]>([]);

    // Track if current question is answered to enable "Next" button
    const [isCurrentAnswered, setIsCurrentAnswered] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            setLoading(true);
            setError(null);
            try {
                // Generate 5 questions
                const data = await generateQuiz(topic.title, topic.subject, 5);
                if (data && data.length > 0) {
                    setQuestions(data);
                } else {
                    setError("Could not generate questions. Please try again.");
                }
            } catch (err) {
                setError("An error occurred while generating the quiz.");
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [topic]);

    const handleAnswer = (isCorrect: boolean, selectedAnswer: string) => {
        if (isCorrect) setScore(prev => prev + 1);
        setIsCurrentAnswered(true);

        // Track the answer
        setUserAnswers(prev => [...prev, {
            questionId: questions[currentIndex].id,
            selectedAnswer,
            isCorrect
        }]);
    };

    const handleNext = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsCurrentAnswered(false);
        } else {
            // Quiz is complete, save result to Firebase
            if (currentUser) {
                const timeSpent = Math.round((Date.now() - startTime) / 1000); // seconds
                const quizResult: QuizResult = {
                    id: crypto.randomUUID(),
                    examType: 'Topic Quiz',
                    subject: topic.subject,
                    score: Math.round((score / questions.length) * 100),
                    totalQuestions: questions.length,
                    correctAnswers: score,
                    timeSpent,
                    completedAt: new Date().toISOString(),
                    answers: userAnswers
                };

                try {
                    await saveQuizResult(currentUser.uid, quizResult);
                    console.log('Quiz result saved successfully');
                } catch (error) {
                    console.error('Failed to save quiz result:', error);
                }
            }
            setShowResult(true);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800 animate-pulse">Generating Quiz for "{topic.title}"...</h2>
                    <p className="text-gray-500">Our AI is crafting unique questions to test your knowledge.</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-soft space-y-4">
                    <Skeleton className="h-8 w-3/4 mb-6" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl inline-block mb-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="font-bold">{error}</p>
                </div>
                <div>
                    <button onClick={onClose} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-gray-700 transition">
                        Back to Topic
                    </button>
                </div>
            </div>
        );
    }

    if (showResult) {
        return (
            <div className="max-w-xl mx-auto text-center py-12 animate-in zoom-in-95">
                <div className="bg-white rounded-3xl shadow-soft p-12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-purple-500"></div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
                    <p className="text-gray-500 mb-8">Here is how you performed on {topic.title}</p>

                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-purple-600 mb-4">
                        {Math.round((score / questions.length) * 100)}%
                    </div>

                    <p className="text-xl font-medium text-gray-700 mb-8">
                        You answered {score} out of {questions.length} correctly.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <button onClick={onClose} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition">
                            Done
                        </button>
                        {/* Could add 'Try Again' here by resetting state */}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Question {currentIndex + 1} / {questions.length}
                </span>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <QuizCard
                key={questions[currentIndex].id}
                question={questions[currentIndex]}
                onAnswer={handleAnswer}
            />

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleNext}
                    disabled={!isCurrentAnswered}
                    className={`
                        px-8 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2 transition-all
                        ${isCurrentAnswered
                            ? 'bg-primary text-white hover:bg-pink-600 hover:scale-105'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    `}
                >
                    {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
            </div>
        </div>
    );
};

export default QuizSession;
