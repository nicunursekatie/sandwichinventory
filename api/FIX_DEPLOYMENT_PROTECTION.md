# Fix: API Requires Authentication

## Problem

Your Vercel deployment has **Deployment Protection** enabled, which requires authentication to access the API. This prevents your GitHub Pages site from calling the API.

## Solution: Disable Deployment Protection

1. **Go to your Vercel project settings:**
   https://vercel.com/nicunursekaties-projects/api/settings/deployment-protection

2. **Disable Deployment Protection:**
   - Find "Deployment Protection" section
   - Turn OFF "Vercel Authentication"
   - Save changes

3. **Alternative: Allow Public Access**
   - If you want to keep protection but allow API access:
   - Go to Settings → Deployment Protection
   - Add an exception for `/api/*` paths
   - Or use "Protection Bypass" tokens (more complex)

## Quick Fix

The easiest solution is to **disable deployment protection** for this API since it needs to be publicly accessible from your GitHub Pages site.

After disabling, your API will be accessible at:
`https://api-7vpilm1bo-nicunursekaties-projects.vercel.app/api/parse-package`

## Verify It Works

After disabling protection, test with:
```bash
curl -X POST https://api-7vpilm1bo-nicunursekaties-projects.vercel.app/api/parse-package \
  -H "Content-Type: application/json" \
  -d '{"text":"Publix turkey breast 16 oz $7.99","ingredientType":"meat"}'
```

You should get a JSON response, not an authentication page.
