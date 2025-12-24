import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const iconColors = {
        success: 'text-green-400',
        error: 'text-red-400',
        info: 'text-blue-400'
    };

    const icons = {
        success: (
            <svg className={`w-5 h-5 ${iconColors.success}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        ),
        error: (
            <svg className={`w-5 h-5 ${iconColors.error}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ),
        info: (
            <svg className={`w-5 h-5 ${iconColors.info}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        )
    };

    return (
        <div className="fixed bottom-24 lg:bottom-6 right-6 z-[70] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg bg-gray-900/95 backdrop-blur-sm text-white transform transition-all animate-in slide-in-from-bottom-5 fade-in duration-300 border border-white/10">
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <p className="font-medium text-sm text-gray-100">{message}</p>
            <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
};

export default Toast;
