import React, { useState, useEffect } from 'react';
import { Topic, AppSettings } from '../types';
import * as CalendarService from '../services/calendarService';
import { getAllData, importAppData, saveUserGoogleCredentials } from '../services/storageService';
import { useAuth } from '../context/AuthContext';

import ConfirmModal from './UI/ConfirmModal';
import { ToastType } from './UI/Toast';
import CustomDropdown from './UI/CustomDropdown';
import CustomTimePicker from './UI/CustomTimePicker';

import { useNavigate, useLocation } from 'react-router-dom';

interface SettingsPageProps {
    settings: AppSettings;
    topics: Topic[]; // Add topics prop
    onSave: (s: AppSettings) => void;
    showToast: (msg: string, type: ToastType) => void;
}

// Helper component to manage string input for number array
const IntervalsInput: React.FC<{ value: number[], onChange: (val: number[]) => void }> = ({ value, onChange }) => {
    // Initialize text state from the array prop
    const [text, setText] = useState(value.join(', '));

    // Update text when the prop changes externally (e.g. from template buttons)
    useEffect(() => {
        setText(value.join(', '));
    }, [value]);

    const handleBlur = () => {
        // Parse on blur
        const rawNumbers = text.split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(Number)
            .filter(n => !isNaN(n) && n > 0);

        const uniqueNumbers = [...new Set(rawNumbers)];
        onChange(uniqueNumbers);
        setText(uniqueNumbers.join(', ')); // Format nicely on blur
    };

    return (
        <input
            className="w-full bg-indigo-50/50 border-0 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary block p-3 transition-all"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            placeholder="e.g. 1, 3, 7, 14"
        />
    );
};

const INTERVAL_PRESETS = {
    DEFAULT: [1, 7, 14, 30, 60],
    FAST: [1, 3, 7, 15],
    SLOW: [10, 20, 40, 90]
};

const isPresetMatch = (arr1: number[], arr2: number[]) => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
};

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, topics: currentTopics, onSave, showToast }) => {
    const navigate = useNavigate();
    const location = useLocation();


    const { currentUser } = useAuth();
    const [localSettings, setLocalSettings] = useState(settings);
    const [newSubject, setNewSubject] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);
    const [isGoogleConnected, setIsGoogleConnected] = useState(settings.googleCalendarConnected);
    const [connectedEmail, setConnectedEmail] = useState<string | null>(settings.googleAccountEmail || null);

    // Confirmation State
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }
    });

    // Check for "Customized" intervals
    const isDefaultPreset = isPresetMatch(localSettings.defaultIntervals, INTERVAL_PRESETS.DEFAULT);
    const isFastPreset = isPresetMatch(localSettings.defaultIntervals, INTERVAL_PRESETS.FAST);
    const isSlowPreset = isPresetMatch(localSettings.defaultIntervals, INTERVAL_PRESETS.SLOW);
    const areIntervalsCustomized = !isDefaultPreset && !isFastPreset && !isSlowPreset;

    // Initial check and URL param check
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const connected = params.get('google_connected');
        const email = params.get('google_email');

        if (connected === 'true') {
            setIsGoogleConnected(true);

            // Sync logic ...
            if (email) {
                setConnectedEmail(email);
                // Update settings with this email
                const newSettings = { ...settings, googleCalendarConnected: true, googleAccountEmail: email };
                setLocalSettings(prev => ({ ...prev, googleCalendarConnected: true, googleAccountEmail: email }));
                onSave(newSettings); // Persist immediately
            }

            // ... (sync logic handles the rest)
        }

        // Ensure local state matches prop if not just redirected
        if (!connected) {
            setIsGoogleConnected(settings.googleCalendarConnected);
            setConnectedEmail(settings.googleAccountEmail || null);

            // Independent check: If connected but no email, try to fetch it now
            if (settings.googleCalendarConnected && !settings.googleAccountEmail) {
                const fetchMissingEmail = async () => {
                    try {
                        const hasToken = await CalendarService.ensureToken();
                        if (hasToken) {
                            const token = window.gapi.client.getToken()?.access_token;
                            if (token) {
                                const fetchedEmail = await CalendarService.fetchUserEmail(token);
                                if (fetchedEmail) {
                                    setConnectedEmail(fetchedEmail);
                                    // Update persistent settings too so we don't fetch every time
                                    const updated = { ...settings, googleAccountEmail: fetchedEmail };
                                    onSave(updated);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("Could not fetch missing email on mount", e);
                    }
                };
                fetchMissingEmail();
            }
        }

    }, [location.search, settings.googleCalendarConnected, settings.googleAccountEmail]);


    // ... handlers ...



    const handleAddSubject = () => {
        if (newSubject && !localSettings.subjects.includes(newSubject)) {
            setLocalSettings(prev => ({ ...prev, subjects: [...prev.subjects, newSubject] }));
            setNewSubject('');
        }
    };

    // ... rest of logic needs to be carefully preserved if I replace largely, but I only want to replace header.
    // Wait, replacing the whole component logic block is risky with replace_file_content if I don't paste it all.
    // Let me target imports first, then the header.

    const removeSubject = (s: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Subject?",
            message: `Are you sure you want to delete "${s}"? This will not delete topics associated with it.`,
            onConfirm: () => {
                setLocalSettings(prev => ({ ...prev, subjects: prev.subjects.filter(sub => sub !== s) }));
                showToast("Subject removed", 'success');
            }
        });
    };



    const applyIntervalTemplate = (template: number[]) => {
        setConfirmModal({
            isOpen: true,
            title: "Change Revision Intervals?",
            message: "This will change the default intervals for NEW topics. Existing topics will not be affected.",
            onConfirm: () => {
                setLocalSettings(prev => ({ ...prev, defaultIntervals: template }));
                showToast("Interval template applied", 'success');
            }
        });
    };

    const handleExportJSON = () => {
        const data = getAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diggiclass_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const data = getAllData();
        const headers = ['ID', 'Title', 'Subject', 'Difficulty', 'Status', 'Revisions Completed', 'Total Revisions'];
        const rows = data.topics.map(t => {
            const completed = t.revisions.filter(r => r.status === 'COMPLETED').length;
            return [
                t.id,
                `"${t.title.replace(/"/g, '""')}"`,
                t.subject,
                t.difficulty,
                completed === t.revisions.length ? 'Completed' : 'Pending',
                completed,
                t.revisions.length
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diggiclass_topics_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            console.log("File read completed. Parsing...");
            showToast("Reading import file...", 'info');

            const content = event.target?.result as string;
            setImportSuccess(null);
            setImportError(null);

            try {
                // 1. Parse and Validate
                const data = JSON.parse(content);
                if (!data.topics && !data.settings) throw new Error("Invalid file format");

                // WARN if empty topics
                if (!data.topics || data.topics.length === 0) {
                    showToast("Warning: The imported file has 0 topics.", 'info');
                }

                // PROTECT Authentication: Don't let an old backup disconnect us
                if (isGoogleConnected && data.settings) {
                    data.settings.googleCalendarConnected = true;
                    data.settings.googleAccountEmail = connectedEmail || data.settings.googleAccountEmail; // Keep current email if available
                }

                // 2. Import Local Data first
                // We pass the modified 'data' stringified to ensure storageService uses the protected version
                const success = importAppData(JSON.stringify(data));
                if (!success) throw new Error("Failed to save imported data locally");

                // 3. Smart Sync with Google Calendar
                const shouldSync = isGoogleConnected || (data.settings?.googleCalendarConnected);

                // --- SAFE MERGE LOGIC ---
                // We merge imported topics with current (Firestore) topics to prevent data loss.
                // Strategy: 
                // 1. Create a Map of existing topics by ID.
                // 2. Add/Overwrite with imported topics (imported takes precedence for same ID).
                // 3. Result is the union of both.

                let importedTopics = data.topics ? [...data.topics] : [];

                // If we have current topics (from Firestore), we merge.
                // If currentTopics is empty (e.g. fresh login), we just use imported.
                let mergedTopics: Topic[] = [...importedTopics];

                if (currentTopics && currentTopics.length > 0) {
                    const topicMap = new Map<string, Topic>();

                    // Add existing topics first
                    currentTopics.forEach(t => topicMap.set(t.id, t));

                    // Merge imported topics (SAFE MERGE: Skip if ID exists)
                    // "Imported topics must not overwrite existing data"
                    let skippedCount = 0;
                    importedTopics.forEach((t: Topic) => {
                        if (!topicMap.has(t.id)) {
                            topicMap.set(t.id, t);
                        } else {
                            skippedCount++;
                        }
                    });

                    mergedTopics = Array.from(topicMap.values());
                    console.log(`Merged topics. Imported ${importedTopics.length}, Skipped ${skippedCount} duplicates.`);
                }

                let updatedTopics = mergedTopics;
                let syncedCount = 0;

                if (shouldSync && updatedTopics.length > 0) {
                    showToast("Imported locally. Syncing with Google Calendar...", 'info');

                    const result = await CalendarService.batchSyncRevisions(updatedTopics);
                    updatedTopics = result.updatedTopics;
                    syncedCount = result.syncedCount;

                    if (syncedCount > 0) {
                        showToast(`Synced/Updated ${syncedCount} events with calendar.`, 'success');
                    }
                }

                // 4. Persistence to Firestore (if logged in)
                if (currentUser) {
                    try {
                        const { saveUserTopics, saveUserSettings, saveQuizResult } = await import('../services/storageService');
                        if (updatedTopics.length > 0) await saveUserTopics(currentUser.uid, updatedTopics);
                        if (data.settings) await saveUserSettings(currentUser.uid, data.settings);
                        if (data.quizResults) {
                            for (const res of data.quizResults) {
                                await saveQuizResult(currentUser.uid, res);
                            }
                        }
                        console.log("Imported data persisted to Firestore");
                    } catch (fsErr) {
                        console.error("Failed to persist to Firestore", fsErr);
                        showToast("Imported locally, but failed to sync to cloud", 'info');
                    }
                }

                // Save to LocalStorage as fallback
                localStorage.setItem('revision_topics', JSON.stringify(updatedTopics));

                setImportSuccess("Data imported and synced! Reloading...");
                setTimeout(() => window.location.reload(), 2000);

            } catch (err: any) {
                console.error("Import Error:", err);
                setImportError(err.message || "Failed to import");
                showToast("Import failed", 'error');
            }
        };
        reader.readAsText(file);
    };

    const syncExistingTopics = async () => {
        try {
            showToast("Syncing existing topics to calendar...", 'info');

            // Get latest data
            const data = getAllData();
            const topics = data.topics || [];

            const { updatedTopics, syncedCount } = await CalendarService.batchSyncRevisions(topics);

            if (syncedCount > 0) {
                localStorage.setItem('revision_topics', JSON.stringify(updatedTopics));
                if (currentUser) {
                    const { saveUserTopics } = await import('../services/storageService');
                    await saveUserTopics(currentUser.uid, updatedTopics);
                }
                showToast(`Synced ${syncedCount} past/future events to calendar.`, 'success');
            } else {
                showToast("All topics are already synced.", 'success');
            }
        } catch (error: any) {
            console.error(error);
            const errorMsg = error?.details || error?.message || (typeof error === 'string' ? error : "Unknown error");
            showToast(`Sync Failed: ${errorMsg}`, 'error');
        }
    };

    const handleGoogleSync = async () => {
        try {
            await CalendarService.handleAuthClick();
            // Code below is unreachable due to redirect, moving logic to useEffect -> syncExistingTopics
        } catch (error: any) {
            console.error(error);
            showToast("Connection init failed", 'error');
        }
    };

    const handleGoogleDisconnect = async () => {
        CalendarService.signOut();
        // Update settings to remove persistence
        const updatedSettings = { ...localSettings, googleCalendarConnected: false };
        setLocalSettings(updatedSettings);
        onSave(updatedSettings);

        if (currentUser) {
            await saveUserGoogleCredentials(currentUser.uid, {}); // specific empty object or null logic in service
        }

        setIsGoogleConnected(false);
        showToast("Google Calendar disconnected", 'success');
    };

    useEffect(() => {
        // Use settings to determine connection status visually
        if (settings.googleCalendarConnected) {
            setIsGoogleConnected(true);
        } else {
            // Fallback check (e.g. if manually connected in this session before save)
            if (CalendarService.checkIsSignedIn()) {
                setIsGoogleConnected(true);
            }
        }
    }, [settings.googleCalendarConnected]);

    // Check for changes
    const isDirty = JSON.stringify(localSettings) !== JSON.stringify(settings);

    const handleManualSave = () => {
        setConfirmModal({
            isOpen: true,
            title: "Save Settings?",
            message: "Are you sure you want to apply these changes?",
            onConfirm: () => {
                onSave(localSettings);
            }
        });
    };

    // Sync local state if props change (e.g. after successful save)
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);


    // Handle Redirect from Supabase Auth (Placed here to access syncExistingTopics)
    useEffect(() => {
        // Check both React Location (hash params) and Window Location (search params before hash)
        const hashParams = new URLSearchParams(location.search);
        const windowParams = new URLSearchParams(window.location.search);
        const isConnected = hashParams.get('google_connected') === 'true' || windowParams.get('google_connected') === 'true';

        if (isConnected) {
            const completeConnection = async () => {
                showToast("Verifying connection...", 'info');
                try {
                    await CalendarService.ensureToken();

                    // Explicitly fetch email if we don't have it yet (URL param failed?)
                    const email = hashParams.get('google_email') || windowParams.get('google_email');
                    let emailToUse = email;

                    if (!emailToUse) {
                        // The token is now set in gapi client by ensureToken
                        const token = window.gapi.client.getToken()?.access_token;
                        if (token) {
                            emailToUse = await CalendarService.fetchUserEmail(token);
                        }
                    }

                    // Success Path
                    setIsGoogleConnected(true);
                    setLocalSettings(prev => ({
                        ...prev,
                        googleCalendarConnected: true,
                        googleAccountEmail: emailToUse || prev.googleAccountEmail
                    }));
                    onSave({
                        ...localSettings,
                        googleCalendarConnected: true,
                        googleAccountEmail: emailToUse || settings.googleAccountEmail
                    });

                    if (emailToUse) setConnectedEmail(emailToUse);

                    showToast("Google Calendar Connected Successfully!", 'success');

                    const event = new CustomEvent('google-auth-success', { detail: { access_token: 'active' } });
                    window.dispatchEvent(event);

                    // Trigger initial sync of existing topics
                    await syncExistingTopics();

                    // Clean URL
                    if (hashParams.get('google_connected')) {
                        navigate(location.pathname, { replace: true });
                    }
                    if (windowParams.get('google_connected')) {
                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.delete('google_connected');
                        window.history.replaceState({}, '', newUrl.toString());
                    }

                } catch (err: any) {
                    console.error("Connection Verification Failed:", err);
                    // Show the specific error to the user
                    const msg = err.message || "Unknown verification error";
                    showToast(`Verification Failed: ${msg}`, 'error');
                }
            };
            completeConnection();
        }
    }, [location.search]);

    const CARD_STYLE = "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-medium transition-shadow duration-300";


    return (
        <div className="max-w-7xl mx-auto px-6 py-6">
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />

            {/* Header with Back Button and Save Action */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95"
                        title="Go Back"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
                </div>

                {isDirty && (
                    <button
                        onClick={handleManualSave}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 text-sm sm:py-2.5 sm:px-6 sm:text-base rounded-xl shadow-soft hover:shadow-lg transition-all transform hover:-translate-y-0.5 animate-in fade-in slide-in-from-right-4"
                    >
                        <span className="sm:hidden">Save</span>
                        <span className="hidden sm:inline">Save Changes</span>
                    </button>
                )}
            </div>

            {/* Main Content - Cards directly on background */}
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Preferences Card */}
                    <div className={`${CARD_STYLE}`}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-purple-50 text-secondary rounded-xl flex items-center justify-center text-xl">⚡</div>
                            <h3 className="text-xl font-bold text-gray-900">Preferences</h3>
                        </div>

                        <div className="space-y-8">
                            {/* Auto Reschedule */}
                            <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-xl">
                                <div>
                                    <span className="font-bold text-gray-800 block">Auto-Reschedule</span>
                                    <span className="text-xs text-gray-500">Automatically shift future dates if missed</span>
                                </div>
                                <div className="relative inline-block w-12 align-middle select-none">
                                    <input type="checkbox" checked={localSettings.autoReschedule} onChange={() => setLocalSettings(prev => ({ ...prev, autoReschedule: !prev.autoReschedule }))} className="absolute block w-6 h-6 rounded-full bg-white border-2 border-gray-200 appearance-none cursor-pointer checked:right-0 checked:border-primary transition-all duration-300" />
                                    <div className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${localSettings.autoReschedule ? 'bg-primary' : 'bg-gray-200'}`}></div>
                                </div>
                            </div>

                            {/* Intervals */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Revision Intervals (Days)</label>
                                    {areIntervalsCustomized && (
                                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100">
                                            Customized
                                        </span>
                                    )}
                                </div>
                                <IntervalsInput
                                    value={localSettings.defaultIntervals}
                                    onChange={(newIntervals) => setLocalSettings(prev => ({ ...prev, defaultIntervals: newIntervals }))}
                                />
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <button
                                        onClick={() => applyIntervalTemplate(INTERVAL_PRESETS.DEFAULT)}
                                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${isDefaultPreset
                                            ? 'bg-green-100 text-green-700 ring-2 ring-green-500 shadow-sm'
                                            : 'bg-green-50 hover:bg-green-100 text-green-600 border border-transparent hover:border-green-200'
                                            }`}
                                    >
                                        Default
                                    </button>
                                    <button
                                        onClick={() => applyIntervalTemplate(INTERVAL_PRESETS.FAST)}
                                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${isFastPreset
                                            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 shadow-sm'
                                            : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-transparent hover:border-blue-200'
                                            }`}
                                    >
                                        Fast Learner
                                    </button>
                                    <button
                                        onClick={() => applyIntervalTemplate(INTERVAL_PRESETS.SLOW)}
                                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${isSlowPreset
                                            ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-500 shadow-sm'
                                            : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border border-transparent hover:border-orange-200'
                                            }`}
                                    >
                                        Slow Learner
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Card */}
                    <div className={`${CARD_STYLE}`}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-xl">🔔</div>
                            <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-xl">
                                <span className="font-bold text-gray-800">Enable Reminders</span>
                                <div className="relative inline-block w-12 align-middle select-none">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.notifications.enabled}
                                        onChange={async () => {
                                            if (!localSettings.notifications.enabled) {
                                                const { requestNotificationPermission } = await import('../services/notificationService');
                                                const granted = await requestNotificationPermission();
                                                if (granted) {
                                                    setLocalSettings(prev => ({ ...prev, notifications: { ...prev.notifications, enabled: true } }));
                                                    showToast("Notifications enabled", 'success');
                                                } else {
                                                    showToast("Permission denied", 'error');
                                                }
                                            } else {
                                                setLocalSettings(prev => ({ ...prev, notifications: { ...prev.notifications, enabled: false } }));
                                            }
                                        }}
                                        className="absolute block w-6 h-6 rounded-full bg-white border-2 border-gray-200 appearance-none cursor-pointer checked:right-0 checked:border-blue-500 transition-all duration-300"
                                    />
                                    <div className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${localSettings.notifications.enabled ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                                </div>
                            </div>

                            <div className={`space-y-4 transition-opacity duration-300 ${localSettings.notifications.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                <div>
                                    <CustomTimePicker
                                        label="Reminder Time"
                                        value={localSettings.notifications.reminderTime}
                                        onChange={(val: string) => setLocalSettings(prev => ({ ...prev, notifications: { ...prev.notifications, reminderTime: val } }))}
                                    />
                                </div>
                                <div>
                                    <CustomDropdown
                                        label="Missed Strategy"
                                        value={localSettings.notifications.missedStrategy}
                                        onChange={(val) => setLocalSettings(prev => ({ ...prev, notifications: { ...prev.notifications, missedStrategy: val as any } }))}
                                        options={[
                                            { value: 'shift', label: 'Shift Dates (Recommended)' },
                                            { value: 'static', label: 'Keep Static' },
                                            { value: 'double', label: 'Double Workload' }
                                        ]}
                                        icon="📋"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Subjects Card */}
                    <div className={CARD_STYLE}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Subjects</h3>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                            <input
                                type="text"
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                className="w-full flex-1 bg-indigo-50/50 border-0 rounded-xl px-4 py-3 text-gray-900 text-sm focus:ring-2 focus:ring-primary placeholder-gray-400"
                                placeholder="Add new subject..."
                            />
                            <button onClick={handleAddSubject} className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3 sm:py-0 rounded-xl transition-colors">
                                Add
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {localSettings.subjects.map(sub => (
                                <span key={sub} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                                    {sub}
                                    <button onClick={() => removeSubject(sub)} className="hover:text-primary-dark">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Data & Backup Card */}
                    <div className={CARD_STYLE}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-xl">💾</div>
                            <h3 className="text-xl font-bold text-gray-900">Data & Backup</h3>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 mb-4">Export your data to keep it safe or transfer to another device.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={handleExportJSON} className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-gray-700 font-bold py-3 rounded-xl transition-colors">
                                    <span>JSON Backup</span>
                                </button>
                                <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-gray-700 font-bold py-3 rounded-xl transition-colors">
                                    <span>Export CSV</span>
                                </button>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Restore from Backup</label>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportJSON}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-pink-600"
                                />
                                {importError && <p className="text-red-500 text-xs mt-2 font-bold">{importError}</p>}
                                {importSuccess && <p className="text-green-500 text-xs mt-2 font-bold">{importSuccess}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`${CARD_STYLE} flex flex-col md:flex-row items-center justify-between gap-8`}>
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            {/* Google Calendar Logo SVG */}
                            <img src="/google_calendar_icon.png" alt="Google Calendar" className="w-14 h-14 object-contain" />
                            {/* Status Indicator Badge */}
                            {isGoogleConnected && (
                                <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Google Calendar Sync</h3>
                            <div className="text-gray-500 text-sm leading-snug">
                                {isGoogleConnected
                                    ? <div className="flex flex-col gap-0">
                                        <span>Your revision schedule is currently synced.</span>
                                        {connectedEmail ? (
                                            <div className="mt-1">
                                                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-medium">
                                                    {connectedEmail}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-amber-600 text-xs font-medium">Email not detected</span>
                                                <button
                                                    onClick={async () => {
                                                        showToast("Refreshing email...", 'info');
                                                        try {
                                                            // Always ensure we have a valid token first
                                                            const hasToken = await CalendarService.ensureToken();
                                                            if (!hasToken) throw new Error("Could not ensure valid token.");

                                                            // Now it's safe to get from gapi
                                                            const token = window.gapi?.client?.getToken()?.access_token;
                                                            if (token) {
                                                                const email = await CalendarService.fetchUserEmail(token);
                                                                if (email) {
                                                                    setConnectedEmail(email);
                                                                    onSave({ ...settings, googleAccountEmail: email });
                                                                    showToast("Email fetched: " + email, 'success');
                                                                } else {
                                                                    showToast("Email scope missing or fetch failed.", 'error');
                                                                }
                                                            } else {
                                                                showToast("No access token available.", 'error');
                                                            }
                                                        } catch (e: any) {
                                                            console.error("Refresh failed", e);
                                                            showToast("Refresh failed: " + (e.message || "Unknown"), 'error');
                                                        }
                                                    }}
                                                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                                >
                                                    Refresh
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    : "Sync your revision schedule to your personal calendar."
                                }
                            </div>
                        </div>
                    </div>

                    {isGoogleConnected ? (
                        <button onClick={handleGoogleDisconnect} className="w-full md:w-auto bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 px-8 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 whitespace-nowrap">
                            Disconnect Account
                        </button>
                    ) : (
                        <button onClick={handleGoogleSync} className="w-full md:w-auto bg-tertiary hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-xl shadow-soft hover:shadow-lg transition-all active:scale-95 whitespace-nowrap">
                            Connect Google Calendar
                        </button>
                    )}
                </div>

                {/* About Section */}
                <div className={`${CARD_STYLE} text-center`}>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">About DiggiClass</h3>
                    <p className="text-gray-500 text-sm mb-4 max-w-2xl mx-auto">
                        I built this app to manage my own learning and revision more effectively. Over time, it evolved into a tool designed to help anyone revise consistently and stay organized.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 text-sm text-gray-400">
                        <span>Built by <strong className="text-gray-600 whitespace-nowrap">Rupam Debnath</strong></span>
                        <span className="hidden md:inline">•</span>
                        <span>Version v1.1</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
