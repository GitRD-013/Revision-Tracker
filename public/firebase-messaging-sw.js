importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
    messagingSenderId: "1074706879853" // From previous context or user env - usually hardcoded or passed via config. 
    // Ideally this should be dynamic but SW limitations often require hardcoding or template replacement.
    // Using a placeholder or finding it from `firebase.ts`... exists in user file as 1074706879853 likely based on VAPID key source project.
    // Safest is to just init default if possible, but messaging requires ID.
});

const messaging = firebase.messaging();

// Handle background messages
messaging.setBackgroundMessageHandler(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Parse payload
    const data = payload.data || {};
    const notificationTitle = data.title || payload.notification?.title || 'Revision Reminder';
    const notificationBody = data.body || payload.notification?.body || 'You have topics due for revision.';

    const notificationOptions = {
        body: notificationBody,
        icon: '/icon-192x192.png',
        data: data, // pass entire data object
        tag: 'revision-reminder',
        renotify: true
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click Received.', event.notification.data);
    event.notification.close();

    // Open the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});
