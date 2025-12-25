import { Topic, AppSettings } from '../types';
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

// Deprecated: Logic moved to Firebase Cloud Functions for background reliability.
export const checkAndSendDueNotifications = (_topics: Topic[], _settings: AppSettings) => {
    // No-op
};
