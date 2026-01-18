const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({
  origin: true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-receipt-token', 'authorization'],
});
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

function getConfig() {
  // Prefer Firebase functions config, fallback to env vars
  const cfg = functions.config() || {};
  return {
    sendgridKey: cfg.sendgrid?.key || process.env.SENDGRID_API_KEY,
    sendFrom: cfg.sendgrid?.from || process.env.SENDGRID_FROM,
    receiptsToken: cfg.receipts?.token || process.env.RECEIPTS_TOKEN,
  };
}

function assertAuth(req) {
  const { receiptsToken } = getConfig();
  if (!receiptsToken) return; // allow if not configured (dev)
  const token = req.get('x-receipt-token') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || token !== receiptsToken) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Sends a receipt PDF via SendGrid.
// Body:
// {
//   to: string,
//   subject: string,
//   html: string,
//   filename: string,
//   pdfBase64: string, // raw base64 (no data: prefix)
//   test: boolean
// }
exports.sendDonationReceiptEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // CORS preflight
      if (req.method === 'OPTIONS') {
        return res.status(204).send('');
      }

      assertAuth(req);
      if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

      const { sendgridKey, sendFrom } = getConfig();
      if (!sendgridKey || !sendFrom) {
        return res.status(500).json({
          ok: false,
          error: 'SendGrid not configured. Set functions config sendgrid.key and sendgrid.from',
        });
      }

      const { to, subject, html, filename, pdfBase64, test } = req.body || {};
      if (!isValidEmail(to)) return res.status(400).json({ ok: false, error: 'Invalid "to" email' });
      if (!subject || typeof subject !== 'string') return res.status(400).json({ ok: false, error: 'Missing subject' });
      if (!html || typeof html !== 'string') return res.status(400).json({ ok: false, error: 'Missing html' });
      if (!filename || typeof filename !== 'string') return res.status(400).json({ ok: false, error: 'Missing filename' });
      if (!pdfBase64 || typeof pdfBase64 !== 'string') return res.status(400).json({ ok: false, error: 'Missing pdfBase64' });

      sgMail.setApiKey(sendgridKey);

      const msg = {
        to: to.trim(),
        from: sendFrom,
        subject: test ? `[TEST] ${subject}` : subject,
        html,
        attachments: [
          {
            content: pdfBase64,
            filename,
            type: 'application/pdf',
            disposition: 'attachment',
          },
        ],
      };

      await sgMail.send(msg);
      return res.json({ ok: true });
    } catch (e) {
      const status = e?.status || 500;
      console.error('sendDonationReceiptEmail error', e);
      return res.status(status).json({ ok: false, error: e?.message || 'Unknown error' });
    }
  });
});

// NOTE:
// This repo previously had a Realtime Database trigger here.
// In a fresh Firebase project (without RTDB enabled), that causes deploy-time analysis to fail
// due to missing `databaseURL`. If you need RTDB triggers later, enable RTDB in Firebase
// and reintroduce them.

// PDF URLs for email attachments (hosted on Firebase Hosting)
const PDF_URLS = {
  deliGuide: 'https://tsp-group-event-guide.web.app/toolkit/20250205-TSP-Deli%20Sandwich%20Making%20101-Groups%20(2).pdf',
  pbjGuide: 'https://tsp-group-event-guide.web.app/toolkit/20250205-TSP-PBJ%20Sandwich%20Making%20101-Groups%20(1).pdf',
  foodSafety: 'https://tsp-group-event-guide.web.app/toolkit/20230525-TSP-Food%2BSafety%2BVolunteers%20(2).pdf',
  deliLabels: 'https://tsp-group-event-guide.web.app/toolkit/Deli%20labels_1749341916236.pdf',
  pbjLabels: 'https://tsp-group-event-guide.web.app/toolkit/Pbj%20labels.pdf',
};

// Helper to format date for display
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// Sends confirmation email when a new group request is submitted
exports.sendToolkitConfirmationEmail = functions.firestore
  .document('groupRequests/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const { sendgridKey, sendFrom } = getConfig();

    if (!sendgridKey || !sendFrom) {
      console.error('SendGrid not configured. Skipping confirmation email.');
      return null;
    }

    if (!data.email || !isValidEmail(data.email)) {
      console.error('Invalid or missing email address:', data.email);
      return null;
    }

    sgMail.setApiKey(sendgridKey);

    // Determine which PDFs to include based on sandwich types
    const sandwichTypes = data.sandwichTypes || [];
    const hasDeli = sandwichTypes.includes('Deli');
    const hasPbj = sandwichTypes.includes('PB&J');

    // Build the list of resources
    let resourcesHtml = '<ul style="margin: 0; padding-left: 20px;">';
    resourcesHtml += `<li><a href="${PDF_URLS.foodSafety}">Food Safety for Volunteers</a></li>`;
    if (hasDeli) {
      resourcesHtml += `<li><a href="${PDF_URLS.deliGuide}">Deli Sandwich Making 101</a></li>`;
      resourcesHtml += `<li><a href="${PDF_URLS.deliLabels}">Deli Sandwich Labels</a> (print before your event)</li>`;
    }
    if (hasPbj) {
      resourcesHtml += `<li><a href="${PDF_URLS.pbjGuide}">PB&J Sandwich Making 101</a></li>`;
      resourcesHtml += `<li><a href="${PDF_URLS.pbjLabels}">PB&J Labels</a> (print before your event)</li>`;
    }
    resourcesHtml += '</ul>';

    // Build the call options list
    let callOptionsHtml = '';
    if (data.callOptions && data.callOptions.length > 0) {
      callOptionsHtml = '<ul style="margin: 0; padding-left: 20px;">';
      data.callOptions.forEach((opt, idx) => {
        if (opt.date && opt.time) {
          callOptionsHtml += `<li>${formatDate(opt.date)} at ${opt.time}</li>`;
        }
      });
      callOptionsHtml += '</ul>';
    }

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #005596; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 25px; }
    .section { margin-bottom: 25px; }
    .section h2 { color: #005596; font-size: 18px; margin-bottom: 10px; border-bottom: 2px solid #FBAD3F; padding-bottom: 5px; }
    .highlight-box { background: #f8f9fa; border-left: 4px solid #005596; padding: 15px; margin: 15px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
    a { color: #005596; }
  </style>
</head>
<body>
  <div class="header">
    <h1>The Sandwich Project</h1>
  </div>
  <div class="content">
    <p>Hi ${data.name || 'there'},</p>

    <p>Thank you for completing the Event Planning Toolkit! We're excited to help you organize your sandwich-making event.</p>

    <div class="section">
      <h2>Your Event Details</h2>
      <ul style="margin: 0; padding-left: 20px;">
        <li><strong>Preferred Date:</strong> ${data.eventDate || 'Not specified'}</li>
        <li><strong>Sandwich Type:</strong> ${sandwichTypes.join(' & ') || 'Not specified'}</li>
        <li><strong>Estimated Quantity:</strong> ${data.sandwichCount || 'Not specified'}</li>
        <li><strong>Location:</strong> ${data.location || 'Not specified'}</li>
      </ul>
    </div>

    <div class="section">
      <h2>Proposed Call Times</h2>
      <p>You've requested a planning call at one of these times:</p>
      ${callOptionsHtml}
      <p style="margin-top: 10px;"><strong>We'll confirm which time works within 2-3 business days.</strong></p>
    </div>

    <div class="section">
      <h2>Your Event Resources</h2>
      <p>Here are the guides and printable materials for your event. <strong>Save these links</strong> — you'll need to print the labels before your event day!</p>
      <div class="highlight-box">
        ${resourcesHtml}
      </div>
    </div>

    <p>If you have any questions before our call, feel free to reply to this email.</p>

    <p>Looking forward to speaking with you!</p>

    <p>— The Sandwich Project Team</p>
  </div>
  <div class="footer">
    <p>The Sandwich Project<br>Making sandwiches. Making a difference.</p>
  </div>
</body>
</html>
    `;

    const msg = {
      to: data.email.trim(),
      from: sendFrom,
      subject: 'Your Event Planning Toolkit Confirmation - The Sandwich Project',
      html: emailHtml,
    };

    try {
      await sgMail.send(msg);
      console.log('Confirmation email sent to:', data.email);

      // Update the document to mark email as sent
      await snap.ref.update({ confirmationEmailSent: true, confirmationEmailSentAt: new Date().toISOString() });

      return { success: true };
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      await snap.ref.update({ confirmationEmailError: error.message });
      return { success: false, error: error.message };
    }
  });
