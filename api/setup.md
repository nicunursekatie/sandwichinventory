# Quick Setup Guide

## Important: GitHub Pages Limitation

**Your main site is hosted on GitHub Pages**, which only serves static files (HTML, CSS, JavaScript). The API endpoint needs to be deployed separately to a service that can run serverless functions.

**Recommended approach:** Deploy the API to Vercel (free) and keep your main site on GitHub Pages.

---

## 1. Deploy the API Endpoint

The API endpoint (`api/parse-package.js`) must be deployed to a serverless function platform. Choose one:

### Option A: Vercel (Recommended - Free & Easy)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy just the API:**
   ```bash
   cd api
   vercel
   ```
   - Follow the prompts to create a new project
   - This will give you a URL like: `https://your-api-name.vercel.app`

3. **Set your API key:**
   ```bash
   vercel env add OPENAI_API_KEY
   # Paste your API key when prompted
   # Select "Production" when asked
   ```

4. **Redeploy with the environment variable:**
   ```bash
   vercel --prod
   ```

5. **Note your API URL** - it will be: `https://your-api-name.vercel.app/api/parse-package`

### Option B: Netlify Functions

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

## 2. Update API Endpoint in Your HTML

Since your site is on GitHub Pages, update the API endpoint to point to your separately deployed API:

**In `redesignedinventorycalculator.html`**, find this line (around line 3080):

```javascript
const API_ENDPOINT = '/api/parse-package';
```

**Change it to your Vercel/Netlify API URL:**

```javascript
const API_ENDPOINT = 'https://your-api-name.vercel.app/api/parse-package';
// Or if using Netlify:
// const API_ENDPOINT = 'https://your-site.netlify.app/.netlify/functions/parse-package';
```

**Important:** Use the full URL (with `https://`) since your site is on a different domain (GitHub Pages) than your API (Vercel/Netlify).

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
