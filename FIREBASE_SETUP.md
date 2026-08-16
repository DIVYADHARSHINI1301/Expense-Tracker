# Firebase Configuration Setup

## ⚠️ IMPORTANT: You need to add your Firebase configuration!

### Step 1: Get Your Firebase Config

1. Go to https://console.firebase.google.com/
2. Select your project (or create one if you haven't)
3. Click the gear icon ⚙️ → Project Settings
4. Scroll down to "Your apps" section
5. Click on your web app or create one
6. Copy the `firebaseConfig` object

### Step 2: Update the Config File

Open `src/firebase/config.js` and replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

### Step 3: Verify Firebase Setup

Make sure you have completed these in Firebase Console:

✅ **Authentication**
- Go to Authentication → Sign-in method
- Enable "Email/Password"
- Enable "Google"

✅ **Firestore Database**
- Go to Firestore Database
- Create database (production mode)
- Set security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 4: Run the Application

```bash
npm run dev
```

### Troubleshooting

If you see errors:
1. Check that your Firebase config is correct
2. Verify Authentication methods are enabled
3. Ensure Firestore rules are published
4. Check browser console for specific errors

### Need Help?

Follow the detailed Firebase setup guide in the main README.md file.
