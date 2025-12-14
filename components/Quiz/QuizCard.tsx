import React, { useState } from 'react';
import { MCQQuestion } from '../../types';

interface QuizCardProps {
    question: MCQQuestion;
    onAnswer: (isCorrect: boolean, selectedAnswer: string) => void;

}

const QuizCard: React.FC<QuizCardProps> = ({ question, onAnswer }) => {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const handleSelect = (idx: number) => {
        if (isAnswered) return;
        setSelectedIdx(idx);
        setIsAnswered(true);
        onAnswer(idx === question.correctAnswerIndex, question.options[idx]);
    };

    const getOptionStyle = (idx: number) => {
        const baseStyle = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-lg mb-3";

        if (!isAnswered) {
            return `${baseStyle} border-gray-100 hover:border-primary hover:bg-pink-50 text-gray-700`;
        }

        if (idx === question.correctAnswerIndex) {
            return `${baseStyle} border-green-500 bg-green-50 text-green-800`;
        }

        if (idx === selectedIdx && idx !== question.correctAnswerIndex) {
            return `${baseStyle} border-red-500 bg-red-50 text-red-800`;
        }

        return `${baseStyle} border-gray-100 opacity-50`;
    };

    return (
        <div className="bg-white rounded-3xl shadow-soft p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
                {question.question}
            </h3>

            <div className="space-y-2">
                {question.options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        disabled={isAnswered}
                        className={getOptionStyle(idx)}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border ${!isAnswered
                                ? 'bg-gray-100 border-gray-200 text-gray-500' // Default state
                                : idx === question.correctAnswerIndex
                                    ? 'bg-green-200 border-green-300 text-green-800' // Correct answer (always highlighted)
                                    : idx === selectedIdx
                                        ? 'bg-red-200 border-red-300 text-red-800' // Wrong selection
                                        : 'bg-gray-100 border-gray-200 text-gray-400' // Unselected
                                }`}>
                                {String.fromCharCode(65 + idx)}
                            </span>
                            {opt}
                        </div>
                    </button>
                ))}
            </div>

            {isAnswered && (
                <div className="mt-6 p-4 bg-blue-50 text-blue-900 rounded-xl animate-in zoom-in-95">
                    <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 flex-shrink-0 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <span className="font-bold block mb-1">Explanation</span>
                            {question.explanation}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizCard;
