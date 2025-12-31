# Package Parsing API

This API endpoint uses GPT-4 to extract structured package information from free-text product descriptions.

## Setup

### Environment Variables

Set the `OPENAI_API_KEY` environment variable with your OpenAI API key:

```bash
export OPENAI_API_KEY="sk-proj-..."
```

### Deployment Options

#### Option 1: Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Set environment variable in Vercel dashboard: `OPENAI_API_KEY`

The `vercel.json` file is already configured.

#### Option 2: Netlify Functions

1. Create `netlify/functions/parse-package.js` (copy from `api/parse-package.js`)
2. Set environment variable in Netlify dashboard: `OPENAI_API_KEY`
3. Deploy to Netlify

#### Option 3: Node.js/Express

```javascript
const express = require('express');
const { handler } = require('./api/parse-package.js');

const app = express();
app.use(express.json());
app.post('/api/parse-package', handler);
app.listen(3000);
```

#### Option 4: AWS Lambda

Wrap the function in a Lambda handler and deploy.

## API Usage

### Endpoint

`POST /api/parse-package`

### Request Body

```json
{
  "text": "Publix turkey breast 16 oz $7.99",
  "ingredientType": "meat"
}
```

### Response Format

```json
{
  "success": true,
  "data": {
    "weight_oz": 16,
    "slices": null,
    "sandwiches_per_package": null,
    "price_usd": 7.99,
    "confidence": 0.95,
    "extracted_text": "Found 16 oz weight and $7.99 price"
  }
}
```

### Response Fields

- `weight_oz`: Weight in ounces (for meat packages)
- `slices`: Number of slices (for cheese packages)
- `sandwiches_per_package`: Number of sandwiches per package (for bread)
- `price_usd`: Price in USD (always included if found)
- `confidence`: Confidence score (0.0 to 1.0)
- `extracted_text`: Human-readable summary of extracted data

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "data": null
}
```

## Testing

```bash
curl -X POST http://localhost:3000/api/parse-package \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Kroger Turkey Family Size 1 lb $4.39",
    "ingredientType": "meat"
  }'
```

## Cost Optimization

The API uses GPT-4 by default. To optimize for cost or speed:

1. **Gemini**: Replace `model: 'gpt-4'` with `model: 'gemini-pro'` and update the API endpoint
2. **Groq**: Use Groq's API with faster models like `llama-3-70b`
3. **GPT-3.5-turbo**: Use `model: 'gpt-3.5-turbo'` for lower cost (less accurate)

Test accuracy before switching models in production.

