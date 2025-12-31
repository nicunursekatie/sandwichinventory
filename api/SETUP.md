# Quick Setup Guide

## 1. Set Your OpenAI API Key

**IMPORTANT:** Your API key should be stored securely and never committed to version control.

Get your API key from: https://platform.openai.com/api-keys

### For Vercel Deployment:

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to project: `cd api`
3. Deploy: `vercel`
4. Set environment variable:
   ```bash
   vercel env add OPENAI_API_KEY
   # Paste your API key when prompted
   ```
5. Redeploy: `vercel --prod`

### For Netlify Deployment:

1. Create `netlify/functions/parse-package.js` (copy from `api/parse-package.js`)
2. In Netlify dashboard → Site settings → Environment variables
3. Add: `OPENAI_API_KEY` = `your-api-key-here`

### For Local Testing:

```bash
export OPENAI_API_KEY="your-api-key-here"
node api/parse-package.js
```

**Note:** Replace `your-api-key-here` with your actual OpenAI API key. Never commit your API key to version control.

## 2. Update API Endpoint in HTML

In `redesignedinventorycalculator.html`, update the `API_ENDPOINT` constant:

```javascript
const API_ENDPOINT = 'https://your-deployed-url.com/api/parse-package';
```

## 3. Test the API

```bash
curl -X POST https://your-deployed-url.com/api/parse-package \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Publix turkey breast 16 oz $7.99",
    "ingredientType": "meat"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "weight_oz": 16,
    "price_usd": 7.99,
    "confidence": 0.95,
    "extracted_text": "Found 16 oz weight and $7.99 price"
  }
}
```

