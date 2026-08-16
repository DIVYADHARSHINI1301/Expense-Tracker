# \ud83d\ude80 Quick Start - Firebase Configuration

## You're almost ready! Just need to add Firebase config.

### \ud83d\udccd Current Status:
- \u2705 All code is ready
- \u2705 Firebase SDK installed
- \u26a0\ufe0f Firebase config needed

### \ud83d\udd11 What You Need:

Your Firebase configuration object that looks like this:

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

### \ud83d\udcdd Where to Add It:

File: `src/firebase/config.js`

Replace lines 6-12 with your actual Firebase config.

### \ud83d\udd27 Firebase Console Checklist:

1. **Create Project** ✅
   - Go to https://console.firebase.google.com/
   - Click "Add project"
   - Name it (e.g., "expense-tracker")

2. **Enable Authentication** ✅
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Enable "Google"

3. **Create Firestore** ✅
   - Go to Firestore Database
   - Click "Create database"
   - Start in production mode
   - Choose location

4. **Set Security Rules** ✅
   - Go to Firestore → Rules tab
   - Paste this:
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
   - Click "Publish"

5. **Get Config** ✅
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Copy the firebaseConfig object
   - Paste into `src/firebase/config.js`

### \u25b6\ufe0f Run the App:

```bash
npm run dev
```

### \ud83c\udf89 That's It!

Once you add your Firebase config, the app will work perfectly with:
- User authentication
- Cloud database
- Real-time sync
- Secure data storage

---

**Need detailed help?** Check `FIREBASE_SETUP.md` or `README.md`
