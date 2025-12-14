import { Topic, AppSettings, RevisionStatus } from '../types';

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

export const sendNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
        // Try to use Service Worker for better mobile support
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body: body,
                    icon: '/icon-192x192.png', // Ensure this exists or use a placeholder
                    badge: '/icon-192x192.png',
                    data: {
                        dateOfArrival: Date.now(),
                        primaryKey: 1
                    }
                });
            });
        } else {
            // Fallback to standard Notification API
            new Notification(title, {
                body: body,
                icon: '/icon-192x192.png'
            });
        }
    }
};

export const checkAndScheduleNotifications = (topics: Topic[], settings: AppSettings) => {
    if (!settings.notifications.enabled) return;

    const today = new Date().toISOString().split('T')[0];
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
            // Check for missed status explicitly if we use that
            if (rev.status === RevisionStatus.MISSED) {
                missedCount++;
            }
        });
    });

    // Simple logic: If we have due items, notify. 
    // In a real app, we might check if we already notified today to avoid spam.
    // For this demo, we'll notify if it's the first time checking this session or if triggered manually.

    if (dueCount > 0) {
        sendNotification("Revision Reminder", `You have ${dueCount} topics to revise today!`);
    } else if (missedCount > 0) {
        sendNotification("Missed Sessions", `You have ${missedCount} missed sessions. Time to catch up!`);
    } else {
        // Optional: Encouragement
        // sendNotification("All Caught Up!", "Great job! You have no pending revisions for today.");
    }
};
