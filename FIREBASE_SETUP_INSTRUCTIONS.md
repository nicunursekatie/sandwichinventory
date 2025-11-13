# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "Sandwich Project Survey" (or whatever you prefer)
4. Disable Google Analytics (unless you want it)
5. Click "Create project"

## Step 2: Set Up Realtime Database

1. In your Firebase project, click "Realtime Database" in the left menu
2. Click "Create Database"
3. Choose location (United States)
4. Start in **test mode** (we'll secure it later)
5. Click "Enable"

## Step 3: Get Your Firebase Config

1. Click the gear icon next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the **</>** (Web) icon
5. Register app name: "Recipient Survey"
6. Copy the `firebaseConfig` object - it looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 4: Update the HTML File

I've created a new version of the HTML file called `expandedrecipientsurvey-firebase.html` that uses Firebase instead of Google Apps Script.

**You need to:**
1. Open `expandedrecipientsurvey-firebase.html`
2. Find the `firebaseConfig` section (around line 870)
3. Replace the placeholder values with YOUR Firebase config from Step 3

## Step 5: Test It

1. Open `expandedrecipientsurvey-firebase.html` in your browser
2. Fill out the form
3. Submit it
4. Go to Firebase Console → Realtime Database
5. You should see your data appear in real-time!

## Step 6: Export to Google Sheets (Optional)

If you still want the data in Google Sheets:

1. In Firebase Console, go to Realtime Database
2. Click the 3 dots menu → "Export JSON"
3. Use a tool like https://www.convertcsv.com/json-to-csv.htm to convert to CSV
4. Import the CSV into Google Sheets

**OR** use a Firebase extension:
1. Go to Extensions in Firebase Console
2. Search for "Export to Google Sheets"
3. Install and configure it to automatically sync data

## Advantages of Firebase

✅ No need to redeploy when making changes
✅ Real-time data updates
✅ Better error messages
✅ Can view submissions instantly
✅ More reliable than Google Apps Script
✅ Can still export to Sheets if needed
