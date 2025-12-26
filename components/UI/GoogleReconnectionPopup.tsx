// React unused in React 17+ JSX transform if configured
import { useNavigate } from 'react-router-dom';

const GoogleReconnectionPopup = ({ onClose }: { onClose: () => void }) => {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-[90%] max-w-[340px] p-6 text-center transform transition-all scale-100 ring-1 ring-gray-900/5">
                <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Google Calendar Disconnected</h3>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                    Your connection to Google Calendar has expired or was revoked. Events will not sync until you reconnect.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                            onClose();
                            navigate('/settings');
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-indigo-100 text-sm"
                    >
                        Go to Settings & Reconnect
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-medium py-3 px-6 rounded-xl transition-colors text-sm"
                    >
                        Ignore for now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoogleReconnectionPopup;
