## Email receipts (batch) via SendGrid + Firebase Functions

This repo includes a Cloud Function `sendDonationReceiptEmail` that sends a receipt PDF attachment via SendGrid.

### Firebase project console

Use this to manage the project (and billing/Blaze plan if prompted for Functions):

`https://console.firebase.google.com/project/donation-receipt-generator/overview`

### 1) Install function dependencies

From the repo root:

```bash
cd firebase-functions
npm install
```

### 2) Configure secrets (recommended)

Set these Firebase Functions config values:

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
firebase functions:config:set sendgrid.from="receipts@yourdomain.org"
firebase functions:config:set receipts.token="YOUR_LONG_RANDOM_TOKEN"
```

Notes:
- `sendgrid.from` must be a verified sender in SendGrid.
- `receipts.token` is used to protect the endpoint. The UI sends it as `x-receipt-token`.

### 3) Deploy the function

```bash
firebase deploy --only functions
```

After deploy, your function URL will be:

`https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/sendDonationReceiptEmail`

(Region can vary; check the deploy output.)

### 4) Use it in `donation-receipt.html`

In **Batch Process**, fill in:
- **Receipt Email Function URL**: your deployed URL
- **Receipt Function Token**: the same `receipts.token` value
- **Test Email Override**: your email (recommended)

Then:
- Click **Send Test Email (First Row)** first
- If it looks good, click **Send All Emails (No Downloads)**

### Spreadsheet requirements

Your Excel file must include an `email` column to send to each person.
Rows without an email will be skipped and reported at the end.


