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
