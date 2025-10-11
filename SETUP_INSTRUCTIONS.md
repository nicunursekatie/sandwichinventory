# Recipient Survey Google Sheets Integration Setup

## Step 1: Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it something like "Recipient Survey Responses"
4. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)

## Step 2: Set Up Google Apps Script
1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete all the default code
3. Copy and paste the entire contents of `GoogleAppsScript_Code.js`
4. **Update the configuration:**
   - Replace `YOUR_GOOGLE_SHEET_ID_HERE` with your actual Sheet ID
   - Optionally change `SHEET_NAME` if you want a different tab name
5. **Save the project** (Ctrl+S or Cmd+S)
6. Give it a name like "Recipient Survey Handler"

## Step 3: Deploy as Web App
1. Click **Deploy > New Deployment**
2. Click the gear icon ⚙️ next to "Type" and select **Web app**
3. Set the following:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**
5. **Copy the Web App URL** (it will look like `https://script.google.com/macros/s/ABC123.../exec`)

## Step 4: Update Your HTML Form
1. Open `recipientsurvey.html`
2. Find this line: `action="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"`
3. Replace `YOUR_SCRIPT_ID` with the ID from your Web App URL
4. Also update the JavaScript fetch URL in the same way
5. Save and test your form!

## Step 5: Test the Integration
1. Fill out the form and submit
2. Check your Google Sheet - you should see the response appear
3. If it works, the first row will be headers, and new responses will appear below

## Troubleshooting
- **Form submits but no data appears:** Check that the Sheet ID is correct
- **"Script not found" error:** Make sure you deployed as a web app with "Anyone" access
- **Headers not appearing:** Run the `setupSheet()` function once in Apps Script

## Security Notes
- The web app is set to "Anyone" access so your form can submit to it
- Only form submissions will be able to add data to your sheet
- Consider setting up email notifications for new submissions if needed
