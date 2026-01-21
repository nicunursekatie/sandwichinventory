# API Deployment Guide for GitHub Pages

## Overview

Your main site is hosted on **GitHub Pages**, which only serves static files. The API endpoint needs to be deployed separately to a serverless function platform.

## Quick Start: Deploy API to Vercel

### Step 1: Deploy the API

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Navigate to the api directory:**
   ```bash
   cd api
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Create a new project
   - Note the URL you get (e.g., `https://sandwich-api.vercel.app`)

4. **Set your OpenAI API key:**
   ```bash
   vercel env add OPENAI_API_KEY
   ```
   - Paste your API key (from `api/API_KEY_INSTRUCTIONS.md`)
   - Select "Production" environment

5. **Redeploy with the environment variable:**
   ```bash
   vercel --prod
   ```

### Step 2: Update Your HTML File

In `redesignedinventorycalculator.html`, find line ~3083 and update:

```javascript
const API_ENDPOINT = 'https://your-api-name.vercel.app/api/parse-package';
```

Replace `your-api-name` with your actual Vercel project name.

### Step 3: Test

1. Push your updated HTML to GitHub
2. Wait for GitHub Pages to deploy
3. Test the package parsing feature in your calculator

## Alternative: Netlify Functions

If you prefer Netlify:

1. Create `netlify/functions/parse-package.js` (copy from `api/parse-package.js`)
2. Create `netlify.toml`:
   ```toml
   [build]
     functions = "netlify/functions"
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```
3. Deploy to Netlify
4. Set `OPENAI_API_KEY` in Netlify dashboard → Site settings → Environment variables
5. Update `API_ENDPOINT` in HTML to: `https://your-site.netlify.app/.netlify/functions/parse-package`

## Architecture

```
┌─────────────────┐         ┌──────────────┐
│  GitHub Pages   │  ─────> │   Vercel     │
│  (Static Site)  │  API    │  (API Func)  │
│                 │  Calls  │              │
└─────────────────┘         └──────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │   OpenAI     │
                              │   GPT-4 API  │
                              └──────────────┘
```

Your HTML files stay on GitHub Pages, but the API calls go to your separately deployed Vercel function.

## Cost

- **Vercel:** Free tier includes 100GB bandwidth/month (more than enough for this use case)
- **OpenAI GPT-4:** ~$0.03 per 1K tokens (very cheap for this simple extraction task)

## Troubleshooting

**CORS Errors:** Vercel automatically handles CORS. If you see CORS errors, make sure your API endpoint URL is correct.

**API Key Not Working:** Verify the environment variable is set in Vercel dashboard → Settings → Environment Variables.

**404 on API Endpoint:** Make sure you deployed to production (`vercel --prod`) and the URL includes `/api/parse-package`.
