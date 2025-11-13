# How to Update Your Google Apps Script

## The Problem
Your form is sending all 36 fields correctly, but only the first 12 columns are being saved to the spreadsheet. This means your Google Apps Script needs to be redeployed with the latest code.

## Steps to Fix

### 1. Open Your Google Apps Script
Go to: https://script.google.com/home

Find your script (it should be linked to your spreadsheet).

### 2. Replace the Code
Copy ALL the code from `surveygooglescript.gs` in this repository and paste it into your Google Apps Script editor.

### 3. Deploy the Updated Script
1. Click **Deploy** → **Manage deployments**
2. Click the **Edit** icon (pencil) next to your existing deployment
3. Change the version to **New version**
4. Add a description like "Fix field mapping for all 37 columns"
5. Click **Deploy**

### 4. IMPORTANT: Update the Form URL
After deployment, you'll get a new deployment URL that looks like:
```
https://script.google.com/macros/s/XXXXXXXXXXXXX/exec
```

**Copy this URL** and update line 511 in `expandedrecipientsurvey.html`:

```html
<form id="surveyForm" action="YOUR_NEW_URL_HERE" method="POST">
```

### 5. Test Again
Fill out the form with test data in ALL fields (especially the textareas and later fields) and verify that all columns are now being populated.

---

## Alternative: Check for Script Errors

If redeploying doesn't work:

1. In Google Apps Script, click **Executions** in the left sidebar
2. Look for recent executions that failed
3. Click on them to see the error message
4. This will tell you exactly which line is failing

Common errors:
- **TypeError: Cannot read property 'X'** - means the field name doesn't match
- **Array index out of bounds** - means the rowData array has wrong number of items
- **Permission denied** - means the script needs to be re-authorized

---

## Verify the Current Deployment

To check which URL is currently being used:

1. Look at line 511 of `expandedrecipientsurvey.html`
2. Current URL: `https://script.google.com/macros/s/AKfycbzSeKM9FHQslxbmQmx4yZ9GwzbvCExJtX1f1QIjnQGh8J5DQZNiOfTlHpNffeNfPvDwwA/exec`

This deployment ID is: `AKfycbzSeKM9FHQslxbmQmx4yZ9GwzbvCExJtX1f1QIjnQGh8J5DQZNiOfTlHpNffeNfPvDwwA`
