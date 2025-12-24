import { Topic, AppSettings, RevisionStatus } from '../types';
import { messaging, db } from '../firebase';
import { getToken, onMessage, Unsubscribe, MessagePayload } from 'firebase/messaging';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.log("This browser does not support desktop notification");
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const sendNotification = async (title: string, body: string): Promise<void> => {
    if (Notification.permission !== 'granted') {
        // Try requesting again?
        return;
    }

    try {
        // Try to use Service Worker for better mobile support
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                body: body,
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: 'diggiclass-reminder',
                data: {
                    dateOfArrival: Date.now(),
                    url: '/'
                }
            });
        } else {
            // Fallback to standard Notification API
            new Notification(title, {
                body: body,
                icon: '/icon-192x192.png',
                tag: 'diggiclass-reminder'
            });
        }
    } catch (error) {
        console.error("Notification failed:", error);
    }
};

// --- FCM Logic ---

export const initializePushNotifications = async (userId: string): Promise<string | null> => {
    if (!messaging) return null;

    try {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) return null;

        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const token = await getToken(messaging, {
                serviceWorkerRegistration: registration,
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
            });

            if (token) {
                // Save token to Firestore
                const userRef = doc(db, 'users', userId);
                await setDoc(userRef, {
                    fcmTokens: arrayUnion(token),
                    lastFcmUpdate: new Date().toISOString()
                }, { merge: true });

                localStorage.setItem('fcmToken', token);
                console.log("FCM Token registered:", token);
                return token;
            }
        }
    } catch (error) {
        console.error("Error initializing push notifications:", error);
    }
    return null;
};

export const onMessageListener = (callback: (payload: MessagePayload) => void): Unsubscribe | null => {
    if (!messaging) return null;
    return onMessage(messaging, (payload) => {
        console.log("Foreground Message received: ", payload);
        // Show local notification if app is in foreground but user needs attention
        if (payload.notification) {
            sendNotification(payload.notification.title || "New Message", payload.notification.body || "");
        } else if (payload.data && payload.data.title && payload.data.body) {
            sendNotification(payload.data.title, payload.data.body);
        }
        callback(payload);
    });
};

// --- Local Check Logic ---

export const checkAndSendDueNotifications = (topics: Topic[], settings: AppSettings) => {
    if (!settings.notifications.enabled) return;

    const today = new Date().toISOString().split('T')[0];
    const lastSentDate = localStorage.getItem('lastNotificationDate');

    // Prevent spam: If already sent today, skip. 
    // TODO: Improve this for "Multiple times per day" if using local logic.
    // For now, if we want multiple checks, we might store "lastSentTime" and check if > 4 hours passed?

    // Changing logic to allow multiple notifications per day (e.g., every 6 hours) if revisions are pending
    const now = Date.now();
    const lastSentTime = parseInt(localStorage.getItem('lastNotificationTime') || '0');
    const FOUR_HOURS = 4 * 60 * 60 * 1000;

    if (now - lastSentTime < FOUR_HOURS && lastSentDate === today) {
        return;
    }

    let dueCount = 0;
    let missedCount = 0;

    topics.forEach(topic => {
        topic.revisions.forEach(rev => {
            if (rev.status === RevisionStatus.PENDING && rev.date === today) {
                dueCount++;
            }
            if (rev.status === RevisionStatus.PENDING && rev.date < today) {
                missedCount++;
            }
            if (rev.status === RevisionStatus.MISSED) {
                missedCount++;
            }
        });
    });

    if (dueCount > 0) {
        sendNotification("Revision Reminder", `You have ${dueCount} topics to revise today!`);
        localStorage.setItem('lastNotificationDate', today);
        localStorage.setItem('lastNotificationTime', now.toString());
    } else if (missedCount > 0) {
        sendNotification("Missed Sessions", `You have ${missedCount} missed sessions. Time to catch up!`);
        localStorage.setItem('lastNotificationDate', today);
        localStorage.setItem('lastNotificationTime', now.toString());
    }
};
