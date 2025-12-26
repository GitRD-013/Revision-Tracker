import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Topic, RevisionStatus, AppSettings, DEFAULT_SETTINGS } from './types';
import { saveUserTopics, saveUserSettings, checkAndMigrateData, saveUserGoogleCredentials, getUserGoogleCredentials, subscribeToUserData, fetchUserData } from './services/storageService';

import * as NotificationService from './services/notificationService';
import { updateTopicRevisions, generateRevisions } from './services/revisionService';
import * as CalendarService from './services/calendarService';
import { GOOGLE_CALENDAR_COLORS } from './services/calendarService';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ProfilePage from './components/auth/ProfilePage';
import ProtectedRoute from './components/auth/ProtectedRoute';

import Dashboard from './components/Dashboard';
import TopicList from './components/TopicList';
import SettingsPage from './components/SettingsPage';
import TopicDetailView from './components/TopicDetailView';
import CalendarPage from './components/CalendarPage';

import Toast, { ToastType } from './components/UI/Toast';

// Initialize GAPI globally
// Initialize GAPI globally
CalendarService.initGapi(import.meta.env.VITE_GOOGLE_CLIENT_ID || '', (success) => {
    if (success) {
        console.log("Google API Initialized");
        // Dispatch explicit event for components to know GAPI is ready
        window.dispatchEvent(new Event('gapi-loaded'));
    } else {
        console.warn("Google API Initialization Failed");
    }
});

// --- CONFIGURATION ---


// --- Standard Styles ---

const INPUT_STYLE = "w-full bg-white border border-gray-200 text-text text-sm rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary block p-3 sm:p-3.5 transition-all";
const CONTAINER = "max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8";


import SideNavigation from './components/SideNavigation';
import BottomNavigation from './components/BottomNavigation';
import AddTopicModal from './components/AddTopicModal';
import CustomDropdown from './components/UI/CustomDropdown';
import CustomDatePicker from './components/UI/CustomDatePicker';
import CustomTimePicker from './components/UI/CustomTimePicker';
import GoogleReconnectionPopup from './components/UI/GoogleReconnectionPopup';







const OfflinePopup = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleOffline = () => setIsOpen(true);
        const handleOnline = () => setIsOpen(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        // Check initial state
        if (!navigator.onLine) {
            setIsOpen(true);
        }

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-[90%] max-w-[320px] p-6 text-center transform transition-all scale-100 ring-1 ring-gray-900/5">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 011.414 0l4.242 4.242M6 6l4.243 4.243" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">You are Offline</h3>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">Changes will be saved locally and synced automatically when you reconnect.</p>
                <button
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-gray-200 text-sm"
                >
                    OK, Got it
                </button>
            </div>
        </div>
    );
};


// --- Simple Rich Text Editor Component ---
interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
}

const SimpleRichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    const handleInput = () => {
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            if (Math.abs(editorRef.current.innerHTML.length - value.length) > 5) {
                editorRef.current.innerHTML = value;
            }
            if (editorRef.current.innerHTML === "" && value !== "") {
                editorRef.current.innerHTML = value;
            }
        }
    }, []);

    const btnClass = "p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-primary transition text-xs font-bold";

    return (
        <div className="w-full bg-gray-50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary">
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200/50">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className={btnClass} title="Bold">B</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className={btnClass} title="Italic">I</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('underline'); }} className={btnClass} title="Underline">U</button>
            </div>
            <div
                ref={editorRef}
                className="w-full min-h-[120px] p-4 outline-none text-gray-800 overflow-y-auto prose prose-sm max-w-none"
                contentEditable
                onInput={handleInput}
            >
            </div>
        </div>
    );
};







// --- Form & Settings Components ---
const AddTopicForm = ({ settings, onSave, initialData }: { settings: AppSettings; onSave: (t: Topic, calendarOptions?: { time: string, colorId: string }) => void; initialData?: Topic }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    const [title, setTitle] = useState(initialData?.title || '');
    const [subject, setSubject] = useState(initialData?.subject || settings.subjects[0] || 'General');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(initialData?.difficulty || 'Medium');
    const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState(initialData?.notes || '');

    // Calendar Customization
    const [selectedTime, setSelectedTime] = useState('09:00');
    const [selectedColor, setSelectedColor] = useState('5'); // Default Banana (Yellow)

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        if (isSubmitting) return; // Prevent double submit
        setIsSubmitting(true);
        // Logic to preserve Past Dates as "Added Date"
        const now = new Date();
        // Construct Local YYYY-MM-DD for accurate day comparison
        const localTodayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

        let finalAddedDate;
        if (startDate < localTodayStr) {
            // If explicit past date, force that date (as UTC midnight to match Calendar key)
            finalAddedDate = new Date(startDate).toISOString();
        } else {
            // If today or future, capture the specific timestamp of creation
            finalAddedDate = now.toISOString();
        }

        const newTopic: Topic = {
            id: initialData?.id || crypto.randomUUID(),
            title,
            subject,
            difficulty,
            startDate,
            addedDate: initialData?.addedDate || finalAddedDate,
            notes,
            revisions: initialData?.revisions || generateRevisions(startDate, settings.defaultIntervals),
        };
        onSave(newTopic, { time: selectedTime, colorId: selectedColor });
        navigate(from);
    };

    return (
        <div className={CONTAINER}>
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm"
                        title="Go Back"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-3xl font-bold text-text">{initialData ? 'Edit Topic' : 'Add New Topic'}</h2>
                </div>

                {/* Main White Card Container */}
                <div className="bg-white rounded-3xl shadow-sm p-5 sm:p-8 border border-gray-100">
                    <div className="mb-8">
                        <p className="text-text-light mt-1">Fill in the details below</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Topic Title</label>
                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className={INPUT_STYLE} placeholder="e.g. Calculus Integration" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <CustomDropdown
                                    label="Subject"
                                    value={subject}
                                    onChange={setSubject}
                                    options={settings.subjects}
                                    placeholder="Select Subject"
                                />
                            </div>
                            <div>
                                <CustomDropdown
                                    label="Difficulty"
                                    value={difficulty}
                                    onChange={(v) => setDifficulty(v as any)}
                                    options={['Easy', 'Medium', 'Hard']}
                                />
                            </div>
                        </div>
                        <div>
                            <CustomDatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={setStartDate}
                            />
                        </div>

                        {/* Calendar Customization Section */}
                        {settings.googleCalendarConnected && (
                            <div className="bg-indigo-50/50 p-6 rounded-xl space-y-4 border border-indigo-100">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Google Calendar Settings
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <CustomTimePicker
                                            label="Default Time"
                                            value={selectedTime}
                                            onChange={setSelectedTime}
                                        />
                                    </div>

                                    <div>
                                        <CustomDropdown
                                            label="Event Color"
                                            value={selectedColor}
                                            onChange={setSelectedColor}
                                            options={GOOGLE_CALENDAR_COLORS.map(c => ({ value: c.id, label: c.name, hex: c.hex }))}
                                            icon={<div className="w-4 h-4 rounded-full" style={{ backgroundColor: GOOGLE_CALENDAR_COLORS.find(c => c.id === selectedColor)?.hex || '#ccc' }}></div>}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                            <SimpleRichTextEditor value={notes} onChange={setNotes} />
                        </div>
                        <div className="pt-6">
                            <button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold text-base h-12 sm:h-14 rounded-xl shadow-soft transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0">
                                {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Topic')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const EditTopicWrapper = ({ topics, settings, onSave }: { topics: Topic[], settings: AppSettings, onSave: (t: Topic, calendarOptions?: { time: string, colorId: string }) => void }) => {
    const { id } = useParams();
    const topic = topics.find(t => t.id === id);
    if (!topic) return <div className="p-12 text-center text-gray-400">Topic not found</div>;
    return <AddTopicForm settings={settings} onSave={onSave} initialData={topic} />;
};





// --- App Content ---
const AppContent = () => {
    // --- State Management ---
    const { currentUser, loading: authLoading } = useAuth(); // Renamed to differentiate
    const [isDataLoading, setIsDataLoading] = useState(true); // New loading state for data
    const [showReconnectionPopup, setShowReconnectionPopup] = useState(false);

    // Effect to check Google Connection on Startup
    useEffect(() => {
        const checkConnection = async () => {
            if (sessionStorage.getItem('google_disconnect_ignored')) return;
            const settingsStr = localStorage.getItem('diggiclass_settings');
            if (!settingsStr) return;

            const localSettingsCheck = JSON.parse(settingsStr);
            if (localSettingsCheck.googleCalendarConnected) {
                try {
                    if (!window.gapi?.client) return;
                    await CalendarService.ensureToken();
                } catch (e: any) {
                    console.warn("Connection check failed:", e);
                    if (e.message?.includes("disconnected") || e.message?.includes("re-authentication") || e.message?.includes("access_token")) {
                        setShowReconnectionPopup(true);
                    }
                }
            }
        };

        if (window.gapi?.client) checkConnection();
        const handleGapiLoad = () => checkConnection();
        window.addEventListener('gapi-loaded', handleGapiLoad);
        return () => window.removeEventListener('gapi-loaded', handleGapiLoad);
    }, []);

    // Initialize with empty/defaults. Data will be fetched on auth.
    const [topics, setTopics] = useState<Topic[]>([]);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [toast, setToast] = useState<{ msg: string, type: ToastType } | null>(null);

    // Layout State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const syncInProgress = useRef<Set<string>>(new Set());
    const [googleCredentials, setGoogleCredentials] = useState<{ refresh_token?: string, access_token?: string, expiry_date?: number } | null>(null);

    const showToast = (msg: string, type: ToastType) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Load Data from Firestore when User Changes (Real-Time Sync)
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const setupSync = async () => {
            if (currentUser) {
                try {
                    // Check and migrate local data to Firestore (one-time)
                    await checkAndMigrateData(currentUser.uid).catch(e => console.error("Migration check failed", e));

                    // Fetch stored Google Credentials (one-time)
                    const creds = await getUserGoogleCredentials(currentUser.uid).catch(e => console.error("Creds fetch failed", e));
                    if (creds) {
                        setGoogleCredentials(creds);
                    }

                    // [NEW] Fetch Initial Data from Supabase
                    try {
                        const initialData = await fetchUserData(currentUser.uid);
                        if (initialData) {
                            setTopics(initialData.topics);
                            setSettings(initialData.settings);
                        }
                    } catch (fetchErr) {
                        console.error("Failed to fetch initial data", fetchErr);
                    } finally {
                        setIsDataLoading(false); // Stop loading after initial fetch attempt
                    }

                    // Subscribe to Real-time Updates
                    const sub = subscribeToUserData(currentUser.uid, (data) => {
                        console.log("Real-time update received", data.topics.length);
                        setTopics(data.topics);
                        setSettings(data.settings);
                        setIsDataLoading(false); // Ensure loading is off on update
                    });
                    unsubscribe = sub.unsubscribe;

                } catch (error: any) {
                    console.error("Failed to setup sync:", error);
                    showToast(error.message || "Failed to sync data", 'error');
                    setIsDataLoading(false);
                }
            } else {
                setTopics([]);
                setSettings(DEFAULT_SETTINGS);
                setIsDataLoading(false);
            }
        };

        setupSync();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser]);

    // Check for notifications when topics or settings change
    // Client-side polling removed in favor of Server-Side Cloud Functions
    // This ensures notifications work even when app is closed.

    // Initialize Google Calendar Service & Listeners
    useEffect(() => {
        const clientID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        // Client Secret not needed for Token Model


        console.log("Initializing Gapi with Client ID:", clientID ? "Found" : "Missing");

        if (clientID) {
            CalendarService.initGapi(clientID, async (success) => {
                console.log("Google Calendar Service Initialized:", success);
            });
        } else {
            console.warn("VITE_GOOGLE_CLIENT_ID is missing in .env");
        }

        // Listen for Auth Success (First connection or Re-connection)
        const handleAuthSuccess = async (e: any) => {
            const creds = e.detail;
            console.log("Auth Success Event:", creds);
            if (currentUser) {
                // Save to DB (optional now since we use localStorage, but good for backup/metadata)
                await saveUserGoogleCredentials(currentUser.uid, creds);
                setGoogleCredentials(creds);
                setSettings(prev => ({ ...prev, googleCalendarConnected: true }));
                await saveUserSettings(currentUser.uid, { ...settings, googleCalendarConnected: true });
                showToast("Google Calendar Connected!", 'success');

                // TRIGGER BATCH SYNC for offline/pending topics
                console.log("Triggering batch sync for pending topics...");

                try {
                    const { updatedTopics, syncedCount } = await CalendarService.batchSyncRevisions(topics);

                    if (syncedCount > 0) {
                        saveTopicsToDb(updatedTopics); // This updates local state and Firestore
                        showToast(`Synced ${syncedCount} pending items to Calendar`, 'success');
                    } else {
                        console.log("No pending topics needed syncing.");
                    }
                } catch (err) {
                    console.error("Batch Sync Error:", err);
                    showToast("Failed to sync some items", 'error');
                }
            }
        };

        // Listen for Token Refresh
        const handleAuthRefresh = async (e: any) => {
            const creds = e.detail;
            console.log("Auth Refresh Event:", creds);
            if (currentUser && googleCredentials) {
                // Update memory and DB
                const newCreds = { ...googleCredentials, ...creds };
                setGoogleCredentials(newCreds);
                await saveUserGoogleCredentials(currentUser.uid, newCreds);
            }
        };

        window.addEventListener('google-auth-success', handleAuthSuccess);
        window.addEventListener('google-auth-refresh', handleAuthRefresh);

        return () => {
            window.removeEventListener('google-auth-success', handleAuthSuccess);
            window.removeEventListener('google-auth-refresh', handleAuthRefresh);
        };
    }, [currentUser, settings.googleCalendarConnected, googleCredentials, topics]); // Added topics dependency for sync

    // Initialize Push Notifications
    useEffect(() => {
        let unsubscribe: (() => void) | null | undefined = null;

        if (currentUser && settings.notifications.enabled) {
            // Request permission & get token
            NotificationService.initializePushNotifications(currentUser.uid);

            // Listen for foreground messages
            unsubscribe = NotificationService.onMessageListener((payload) => {
                console.log("Foreground message received in App:", payload);
                if (payload.notification) {
                    showToast(payload.notification.title || "New Notification", 'info');
                }
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser, settings.notifications.enabled]);


    const saveTopicsToDb = async (newTopics: Topic[]) => {
        setTopics(newTopics);
        if (currentUser) {
            try {
                await saveUserTopics(currentUser.uid, newTopics);
            } catch (error: any) {
                showToast(error.message || "Failed to sync data", 'error');
            }
        }
    };

    const handleSaveTopic = async (updatedTopic: Topic, calendarOptions?: { time: string, colorId: string }) => {
        // 1. Optimistic Save: Save locally/DB first to ensure UI responsiveness and data safety
        let topicToSave = { ...updatedTopic };
        const exists = topics.some(t => t.id === topicToSave.id);
        const newTopics = exists ? topics.map(t => t.id === topicToSave.id ? topicToSave : t) : [...topics, topicToSave];
        saveTopicsToDb(newTopics);

        // 2. Background Sync: Attempt to sync with Google Calendar if connected
        // Check preference flag instead of active token (lazy init)
        if (settings.googleCalendarConnected) {
            // Prevent concurrent syncs for the same topic
            if (syncInProgress.current.has(topicToSave.id)) {
                console.log("Sync already in progress for topic", topicToSave.id);
                return;
            }
            syncInProgress.current.add(topicToSave.id);

            try {
                // If it's a new topic (or we want to ensure all revisions have events), we iterate
                // Ideally, we only add events that don't have IDs yet.
                let revisionsChanged = false;
                const updatedRevisions = await Promise.all(topicToSave.revisions.map(async (rev) => {
                    // Start of Sync Logic
                    try {
                        // 1. New Events (Pending & No ID)
                        if (!rev.googleEventId && rev.status === RevisionStatus.PENDING) {
                            await CalendarService.ensureToken();
                            const eventId = await CalendarService.addEventToCalendar(
                                topicToSave.title,
                                rev.date,
                                topicToSave.subject,
                                calendarOptions?.time || settings.defaultCalendarTime,
                                calendarOptions?.colorId,
                                topicToSave.id, // Pass ID
                                rev.id          // Pass Rev ID
                            );
                            if (eventId) {
                                revisionsChanged = true;
                                return { ...rev, googleEventId: eventId };
                            }
                        }
                        // 2. Existing Events (Update Sync)
                        else if (rev.googleEventId) {
                            // If we are editing, we want to update the calendar event too
                            await CalendarService.ensureToken();

                            // Use the specific time if provided, or fall back to the setting -> default
                            const timeToUse = calendarOptions?.time || settings.defaultCalendarTime || '09:00';

                            await CalendarService.updateEvent(
                                rev.googleEventId,
                                topicToSave.title,
                                rev.date,
                                topicToSave.subject,
                                timeToUse,
                                calendarOptions?.colorId // Preserve color if not explicitly changing
                            );
                        }
                    } catch (e) {
                        console.error("Error syncing revision", rev.id, e);
                    }
                    return rev;
                }));

                if (revisionsChanged) {
                    topicToSave = { ...topicToSave, revisions: updatedRevisions };
                    const updatedTopicsWithIds = newTopics.map(t => t.id === topicToSave.id ? topicToSave : t);
                    saveTopicsToDb(updatedTopicsWithIds);
                    console.log("Synced with Google Calendar and updated IDs");
                }
            } catch (err) {
                console.error("Failed to sync with calendar", err);
                showToast("Failed to sync with Google Calendar, but topic is saved locally", 'error');
            } finally {
                syncInProgress.current.delete(topicToSave.id);
            }
        }
    };

    const handleDeleteTopic = async (id: string) => {
        // 1. Optimistic UI Update
        const topicToDelete = topics.find(t => t.id === id);
        const newTopics = topics.filter(t => t.id !== id);
        saveTopicsToDb(newTopics);
        showToast("Topic deleted locally. Cleaning up calendar...", 'info');

        // 2. Background Calendar Cleanup
        if (topicToDelete && settings.googleCalendarConnected) {
            const eventIds = topicToDelete.revisions
                .map(r => r.googleEventId)
                .filter(eid => !!eid) as string[];

            if (eventIds.length > 0) {
                // Execute in background
                CalendarService.ensureToken().then(async (hasToken) => {
                    if (hasToken) {
                        console.log(`[Background Delete] Removing ${eventIds.length} events for ${topicToDelete.title}`);
                        await Promise.all(eventIds.map(eid =>
                            CalendarService.deleteEventFromCalendar(eid!)
                                .catch(e => console.error(e))
                        ));
                        console.log(`[Background Delete] Completed cleanup for ${topicToDelete.title}`);
                    }
                }).catch(err => console.error("Background deletion error:", err));
            }
        }
    };

    const handleDuplicateTopic = (topic: Topic) => {
        const dup = { ...topic, id: crypto.randomUUID(), title: `${topic.title} (Copy)`, addedDate: new Date().toISOString() };
        const newTopics = [...topics, dup];
        saveTopicsToDb(newTopics);
    };

    const handleStatusUpdate = (topicId: string, revId: string, status: RevisionStatus) => {
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;

        // Use Service to handle logic (shifting dates if needed)
        const updatedTopic = updateTopicRevisions(
            topic,
            revId,
            status,
            { missedStrategy: settings.notifications.missedStrategy }
        );

        const newTopics = topics.map(t => t.id === topicId ? updatedTopic : t);
        saveTopicsToDb(newTopics);
    };

    const handleSaveSettings = async (newSettings: AppSettings) => {
        setSettings(newSettings);
        if (currentUser) {
            try {
                await saveUserSettings(currentUser.uid, newSettings);
                showToast("Settings saved", 'success');
            } catch (error: any) {
                showToast(error.message || "Failed to save settings", 'error');
            }
        }
    };

    // Auto-Sync on Reconnect
    useEffect(() => {
        const handleOnline = () => {
            showToast("Back online! Syncing data...", 'info');
            if (currentUser) {
                // Trigger Saves
                saveUserTopics(currentUser.uid, topics).catch(err => console.error(err));
                saveUserSettings(currentUser.uid, settings).catch(err => console.error(err));
            }
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [currentUser, topics, settings]);






    if (authLoading || (currentUser && isDataLoading)) {
        return (
            <div className="min-h-screen bg-background flex">
                {/* Skeleton Sidebar - Hidden on mobile, visible on md */}
                <div className="hidden md:flex w-20 lg:w-64 flex-col gap-4 border-r border-gray-200 bg-white p-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="mt-8 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-10 w-full bg-gray-100 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                </div>

                {/* Skeleton Main Content */}
                <div className="flex-1 p-6 space-y-8">
                    {/* Header Skeleton */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-2">
                            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
                        </div>
                        <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
                    </div>

                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse p-6 space-y-4">
                                <div className="h-4 w-24 bg-gray-100 rounded"></div>
                                <div className="h-8 w-16 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>

                    {/* Content Grid Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="h-64 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse"></div>
                        </div>
                        <div className="space-y-6">
                            <div className="h-48 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-background font-sans text-gray-900">
            <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="loader"></div></div>}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    <Route path="*" element={
                        <ProtectedRoute>
                            <div className="flex min-h-screen">
                                <div className="hidden md:flex">
                                    <SideNavigation
                                        isOpen={isSidebarOpen}
                                        onCloseMobile={() => setIsSidebarOpen(false)}
                                        onHoverChange={setIsSidebarExpanded}
                                        isExpanded={isSidebarExpanded}
                                    />
                                </div>

                                {/* Mobile Header */}
                                {/* Mobile Header Removed - Using Bottom Nav */}

                                {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}


                                {showReconnectionPopup && (
                                    <GoogleReconnectionPopup
                                        onClose={() => {
                                            setShowReconnectionPopup(false);
                                            // Mark as ignored for this session so it doesn't pop up on every route change (though this effect runs once on mount)
                                            sessionStorage.setItem('google_disconnect_ignored', 'true');
                                        }}
                                    />
                                )}
                                <AddTopicModal
                                    isOpen={isTopicModalOpen}
                                    onClose={() => setIsTopicModalOpen(false)}
                                    settings={settings}
                                    onSave={handleSaveTopic}
                                    onUpdateSettings={handleSaveSettings}
                                />

                                <main
                                    className={`flex-1 w-full max-w-[100vw] overflow-x-hidden transition-all duration-300 ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'} pt-6 md:pt-0 pb-32 md:pb-0`}
                                >
                                    <Routes>
                                        <Route path="/" element={<Dashboard topics={topics} onStatusUpdate={handleStatusUpdate} onAddTopic={() => setIsTopicModalOpen(true)} />} />
                                        <Route path="/topics" element={
                                            <TopicList
                                                topics={topics}
                                                onDelete={handleDeleteTopic}
                                                onDuplicate={handleDuplicateTopic}
                                                onAddTopic={() => setIsTopicModalOpen(true)}
                                                viewMode={settings.topicViewMode || 'grid'}
                                                onViewModeChange={(mode) => handleSaveSettings({ ...settings, topicViewMode: mode })}
                                            />
                                        } />
                                        <Route path="/add" element={<AddTopicForm settings={settings} onSave={handleSaveTopic} />} />
                                        <Route path="/edit/:id" element={<EditTopicWrapper topics={topics} settings={settings} onSave={handleSaveTopic} />} />
                                        <Route path="/settings" element={<SettingsPage settings={settings} topics={topics} onSave={handleSaveSettings} showToast={showToast} />} />
                                        <Route path="/topic/:id" element={<TopicDetailView topics={topics} onDelete={handleDeleteTopic} />} />
                                        <Route path="/calendar" element={<CalendarPage topics={topics} onStatusUpdate={handleStatusUpdate} />} />
                                        <Route path="/profile" element={<ProfilePage />} />
                                    </Routes>
                                </main>
                                <BottomNavigation />
                            </div >
                        </ProtectedRoute >
                    } />
                </Routes >
            </React.Suspense>
            <OfflinePopup />
        </div >
    );
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    )
}

export default App;