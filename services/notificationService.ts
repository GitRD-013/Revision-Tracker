import { Topic, AppSettings } from '../types';
import { messaging } from '../firebase';
import { supabase } from './supabase';
import { getToken, onMessage, Unsubscribe, MessagePayload } from 'firebase/messaging';

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
        return;
    }

    try {
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
                // Save token to Supabase instead of Firestore
                const { error } = await supabase
                    .from('push_subscriptions')
                    .upsert({
                        user_id: userId,
                        fcm_token: token,
                        device_type: navigator.userAgent, // optional info
                        last_updated: new Date()
                    }, { onConflict: 'user_id, fcm_token' }); // Composite key

                if (error) {
                    console.error("Failed to save FCM token to Supabase:", error);
                } else {
                    console.log("FCM Token registered to Supabase:", token);
                }

                localStorage.setItem('fcmToken', token);
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

        const title = payload.notification?.title || payload.data?.title || "New Message";
        const body = payload.notification?.body || payload.data?.body || "";

        // Only show if we have meaningful content
        if (title !== "New Message" || body !== "") {
            sendNotification(title, body);
        }

        callback(payload);
    });
};

// --- Local Check Logic ---
// Removed as currently handled by Cloud Functions / Edge Functions
export const checkAndSendDueNotifications = (_topics: Topic[], _settings: AppSettings) => {
    // No-op
};
