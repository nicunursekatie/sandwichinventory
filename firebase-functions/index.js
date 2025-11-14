const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Email notification when new survey submitted
exports.notifyOnNewSurvey = functions.database
  .ref('/survey-responses/{responseId}')
  .onCreate((snapshot, context) => {
    const data = snapshot.val();
    const responseId = context.params.responseId;

    // Format email content
    const emailSubject = `New Survey: ${data.orgName}`;
    const emailBody = `
New recipient survey submitted!

Organization: ${data.orgName}
Contact: ${data.contactName}
Email: ${data.contactEmail}
Phone: ${data.contactPhone}

Service Area: ${data.serviceArea || 'Not provided'}
People Served: ${data.avgPeopleServed || 'Not provided'} ${data.frequency || ''}

Partnership Length: ${data.yearsReceivingSandwiches || 'Not provided'}
Delivery Rating: ${data.deliveryRating || 'Not provided'}/5

${data.deliveryRating && parseInt(data.deliveryRating) < 5 ?
  `⚠️ Delivery Feedback: ${data.deliveryFeedback}\n` : ''}

${data.seasonalNeeds === 'Yes' ?
  `📅 Seasonal Needs: ${data.seasonalDetails}\n` : ''}

${data.impactStory ?
  `💬 Impact Story: ${data.impactStory}\n` : ''}

View full response:
https://nicunursekatie.github.io/sandwichinventory/view-responses.html

Response ID: ${responseId}
Submitted: ${new Date(data.timestamp).toLocaleString()}
    `;

    // Log for now (you'll configure email in Firebase Console)
    console.log('New survey submission:', emailSubject);
    console.log(emailBody);

    // TODO: Set up email extension in Firebase Console to actually send
    // Extension URL: https://extensions.dev/extensions/firebase/firestore-send-email

    return null;
  });
