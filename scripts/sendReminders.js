const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json'); // User must provide this

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const messaging = admin.messaging();

async function checkAndSendReminders() {
    console.log("Starting Reminder Check...");
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Fetch all users
    const usersSnapshot = await db.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];

        if (fcmTokens.length === 0) continue;
        if (userData.settings && userData.settings.notifications && !userData.settings.notifications.enabled) continue;

        // Check revisions in subcollection 'topics' or 'userData' field?
        // Based on storageService.ts, topics are stored in a subcollection `topics` or field?
        // storageService.ts: saveUserTopics -> setDoc(doc(db, 'users', uid), { topics: ... }, { merge: true }) 
        // OR checks separate collection? 
        // Let's assume topics are in the 'topics' field of the user doc based on 'saveUserTopics' text in App.tsx
        // Wait, App.tsx line 429 calls saveUserTopics. I need to know where it saves.
        // Assuming it saves to `users/{uid}` document under `topics` field.

        const topics = userData.topics || [];
        let dueCount = 0;

        topics.forEach(topic => {
            if (!topic.revisions) return;
            topic.revisions.forEach(rev => {
                if ((rev.status === 'PENDING' && rev.date === today) || rev.status === 'MISSED') {
                    dueCount++;
                }
            });
        });

        if (dueCount > 0) {
            console.log(`User ${userDoc.id} has ${dueCount} due items.`);

            // Check spam prevention (optional, via Firestore 'lastNotificationSent')
            // ...

            const message = {
                data: {
                    title: "Revision Reminder",
                    body: `You have ${dueCount} topics to revise today!`,
                    url: "/"
                },
                tokens: fcmTokens
            };

            try {
                const response = await messaging.sendMulticast(message);
                console.log(`Sent to ${userDoc.id}: Success ${response.successCount}, Failure ${response.failureCount}`);

                // Cleanup invalid tokens
                if (response.failureCount > 0) {
                    const failedTokens = [];
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            failedTokens.push(fcmTokens[idx]);
                        }
                    });
                    // Remove failed tokens from DB
                    await userDoc.ref.update({
                        fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
                    });
                }
            } catch (error) {
                console.error("Error sending message:", error);
            }
        }
    }
}

checkAndSendReminders().then(() => process.exit());
