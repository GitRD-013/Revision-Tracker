# Firebase Setup Instructions

## Environment Variables

1. Create a `.env` file in the project root (already created)
2. The file contains your Firebase configuration
3. **IMPORTANT**: Never commit `.env` to version control
4. For other developers, use `.env.example` as a template

## Deploying Firestore Security Rules

To deploy the security rules to your Firebase project:

### Option 1: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `revision-tracker-970a0`
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` and paste into the editor
5. Click **Publish**

### Option 2: Using Firebase CLI

```powershell
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

## Security Rules Overview

The current rules ensure:
- ✅ Users can only access their own data
- ✅ All operations require authentication
- ✅ Data structure validation for writes
- ✅ Read/write access restricted to user's own document

## Testing the Integration

1. **Start the development server**: `npm run dev`
2. **Sign up** a new account or **login** with existing credentials
3. **Create topics** and verify they save to Firestore
4. **Complete quizzes** and check results are saved
5. **Logout and login again** to verify data persists

## Monitoring

You can monitor your Firebase usage in the Firebase Console:
- **Authentication** → See all users
- **Firestore Database** → View stored data
- **Usage** → Monitor read/write operations

## Offline Support

The app now supports offline data persistence:
- Changes made while offline will sync when reconnected
- Local IndexedDB cache provides offline access
- Offline banner appears when disconnected
