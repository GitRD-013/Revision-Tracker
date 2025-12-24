import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
    const { currentUser, logout, resetPassword } = useAuth();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } catch {
            setError('Failed to log out');
        }
    };

    const handleResetPassword = async () => {
        if (!currentUser?.email) return;
        try {
            setMessage('');
            setError('');
            setLoading(true);
            await resetPassword(currentUser.email);
            setMessage('Check your inbox for further instructions');
        } catch {
            setError('Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-6 py-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm"
                            title="Go Back"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
                    </div>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">{error}</div>}
                {message && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6">{message}</div>}

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                        <div className="text-lg font-semibold text-gray-900">{currentUser?.displayName || 'User'}</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                        <div className="text-lg font-semibold text-gray-900">{currentUser?.email}</div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Security</h3>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-indigo-50/50 rounded-xl gap-4">
                            <div>
                                <div className="font-medium text-gray-900">Password</div>
                                <div className="text-sm text-gray-500">Change your password via email</div>
                            </div>
                            <button
                                onClick={handleResetPassword}
                                disabled={loading}
                                className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-indigo-50 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap text-sm"
                            >
                                Reset Password
                            </button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Account</h3>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-50/50 rounded-xl gap-4">
                            <div>
                                <div className="font-medium text-gray-900">Sign Out</div>
                                <div className="text-sm text-gray-500">Sign out of your account</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full sm:w-auto px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors shadow-sm whitespace-nowrap text-sm"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
