const admin = require("firebase-admin");

// Initialize Firebase Admin using Environment Variables (from GitHub Secrets)
// We expect a Service Account JSON string in the FIREBASE_SERVICE_ACCOUNT environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

async function sendRevisionReminders() {
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
    console.log("Starting Revision Reminder Check for date:", today);

    try {
        const usersSnapshot = await db.collection("users").get();
        const notificationsPromises = [];

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const fcmTokens = userData.fcmTokens || [];

            if (fcmTokens.length === 0) continue;

            let pendingTopics = [];
            // Assuming 'topics' object or array structure in Firestore. 
            // Adapt this to match your exact Firestore structure if 'topics' is a subcollection.
            // Current app code suggests 'saveUserTopics' saves strictly to a field or subcollection? 
            // Based on storageService.ts: setDoc(doc(db, 'users', userId), { topics }, { merge: true })
            // So 'topics' IS a field in the user document.

            if (userData.topics && Array.isArray(userData.topics)) {
                pendingTopics = userData.topics.filter(topic => {
                    // topic.revisions is an array of objects
                    return topic.revisions && topic.revisions.some(rev =>
                        (rev.status === "Pending" || rev.status === "PENDING") && rev.date <= today
                    );
                });
            }

            if (pendingTopics.length > 0) {
                console.log(`User ${userDoc.id} has ${pendingTopics.length} pending topics.`);
                const topicNames = pendingTopics.map(t => t.title).slice(0, 2).join(", ");
                const moreCount = pendingTopics.length - 2;
                const body = moreCount > 0
                    ? `You have revisions due for: ${topicNames} and ${moreCount} more.`
                    : `You have revisions due for: ${topicNames}.`;

                const payload = {
                    notification: {
                        title: "Revision Reminder 📝",
                        body: body,
                    },
                    data: {
                        url: "/"
                    }
                };

                const sendPromise = messaging.sendToDevice(fcmTokens, payload)
                    .then(async (response) => {
                        const tokensToRemove = [];
                        response.results.forEach((result, index) => {
                            const error = result.error;
                            if (error) {
                                console.error('Failure sending notification to', fcmTokens[index], error);
                                if (error.code === 'messaging/invalid-registration-token' ||
                                    error.code === 'messaging/registration-token-not-registered') {
                                    tokensToRemove.push(fcmTokens[index]);
                                }
                            }
                        });

                        if (tokensToRemove.length > 0) {
                            await db.collection("users").doc(userDoc.id).update({
                                fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
                            });
                        }
                    })
                    .catch(err => {
                        console.error("Error sending message to user", userDoc.id, err);
                    });

                notificationsPromises.push(sendPromise);
            }
        }

        await Promise.all(notificationsPromises);
        console.log("Finished sending revision reminders.");
        process.exit(0);

    } catch (error) {
        console.error("Error in sendRevisionReminders:", error);
        process.exit(1);
    }
}

sendRevisionReminders();
