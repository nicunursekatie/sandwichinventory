# Firebase Email Notifications Setup

## Option 1: Use Firebase Extension (Easiest - No Code!)

1. **Go to Firebase Console** → https://console.firebase.google.com/
2. Select your **"recipient-survey"** project
3. Click **"Extensions"** in the left menu
4. Click **"Install Extensions"**
5. Search for **"Trigger Email"**
6. Click **Install** on "Trigger Email from Firestore"
7. Configure:
   - **SMTP Connection**: Use Gmail or SendGrid
   - **Email Documents Collection**: `mail`
   - **Default FROM**: `info@sandwichproject.org`
   - **Default REPLY-TO**: `info@sandwichproject.org`

8. **Add a Cloud Function** to create email documents:

```javascript
// Add this to firebase-functions/index.js
exports.createEmailOnNewSurvey = functions.database
  .ref('/survey-responses/{responseId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.val();

    // Create email document for extension to send
    await admin.firestore().collection('mail').add({
      to: 'your-email@sandwichproject.org', // Change this!
      message: {
        subject: `New Survey: ${data.orgName}`,
        html: `
          <h2>New Recipient Survey Submitted!</h2>
          <h3>Organization: ${data.orgName}</h3>
          <p><strong>Contact:</strong> ${data.contactName}</p>
          <p><strong>Email:</strong> ${data.contactEmail}</p>
          <p><strong>Phone:</strong> ${data.contactPhone}</p>
          <hr>
          <p><strong>Service Area:</strong> ${data.serviceArea}</p>
          <p><strong>People Served:</strong> ${data.avgPeopleServed} ${data.frequency}</p>
          <p><strong>Partnership Length:</strong> ${data.yearsReceivingSandwiches}</p>
          <p><strong>Delivery Rating:</strong> ${data.deliveryRating}/5</p>
          ${data.deliveryRating && parseInt(data.deliveryRating) < 5 ?
            `<p style="color: #c53030;"><strong>⚠️ Delivery Feedback:</strong> ${data.deliveryFeedback}</p>` : ''}
          ${data.seasonalNeeds === 'Yes' ?
            `<p><strong>📅 Seasonal Needs:</strong> ${data.seasonalDetails}</p>` : ''}
          ${data.impactStory ?
            `<p><strong>💬 Impact Story:</strong><br>${data.impactStory}</p>` : ''}
          <hr>
          <a href="https://nicunursekatie.github.io/sandwichinventory/view-responses.html">View Full Response</a>
          <p><small>Submitted: ${new Date(data.timestamp).toLocaleString()}</small></p>
        `
      }
    });
  });
```

## Option 2: Use SendGrid API (More Control)

1. Sign up for free SendGrid account: https://sendgrid.com/
2. Get API key
3. Install Firebase CLI: `npm install -g firebase-tools`
4. In your project: `cd firebase-functions && npm install @sendgrid/mail`
5. Deploy function with SendGrid integration

## Option 3: Simple Email via Gmail SMTP

Use Nodemailer in the Cloud Function (requires Gmail app password)

---

## Testing Locally

```bash
cd firebase-functions
npm install
firebase emulators:start
```

## Deploy to Production

```bash
firebase deploy --only functions
```

---

## What You Get

✅ **Instant notification** when someone submits survey
✅ **Key details** in email (org name, contact, rating)
✅ **Flagged issues** (low ratings, seasonal needs)
✅ **Impact stories** highlighted
✅ **Direct link** to full response viewer

The easiest option is #1 - the Firebase extension handles everything!
