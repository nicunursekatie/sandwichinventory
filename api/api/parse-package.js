/**
 * API Endpoint for Package Information Extraction using GPT-4
 * 
 * This endpoint accepts free-text package descriptions and returns structured data
 * (weight, price, servings) for the calculator to use.
 * 
 * Deployment options:
 * - Vercel: Create vercel.json and deploy
 * - Netlify: Create netlify/functions/parse-package.js
 * - Node.js/Express: Use as Express route
 * - AWS Lambda: Wrap in Lambda handler
 */

// Get API key from environment variable
// IMPORTANT: Set OPENAI_API_KEY in your deployment environment
// Never commit API keys to version control
// 
// To set for local testing:
// export OPENAI_API_KEY="your-api-key-here"
// 
// See api/SETUP.md for instructions on setting your API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('Warning: OPENAI_API_KEY environment variable is not set');
}

/**
 * Extract package information from free text using GPT-4
 * @param {string} text - Free text description of the package
 * @param {string} ingredientType - Type of ingredient: 'meat', 'cheese', or 'bread'
 * @returns {Promise<Object>} Structured package data
 */
async function extractPackageInfo(text, ingredientType) {
    const systemPrompt = `You are a helpful assistant that extracts structured information from product descriptions for a sandwich planning calculator.

Extract the following information from the product description:
- For MEAT: weight in ounces (weight_oz) and price in USD (price_usd). If weight is given in pounds, convert to ounces (1 lb = 16 oz).
- For CHEESE: number of slices (slices) and price in USD (price_usd).
- For BREAD: number of sandwiches per package (sandwiches_per_package) and price in USD (price_usd). A standard loaf typically makes 10 sandwiches (20 slices minus 2 heels).

Return ONLY valid JSON in this exact format:
{
  "weight_oz": <number or null>,
  "slices": <number or null>,
  "sandwiches_per_package": <number or null>,
  "price_usd": <number>,
  "confidence": <number between 0 and 1>,
  "extracted_text": <string of what you found>
}

Rules:
- If information is missing or unclear, use null for that field
- Always include price_usd if a price can be found
- confidence should reflect how certain you are (1.0 = very certain, 0.5 = somewhat certain, 0.0 = uncertain)
- extracted_text should be a brief summary of what you extracted
- Return ONLY the JSON, no other text`;

    const userPrompt = `Extract package information from this ${ingredientType} product description:

"${text}"

Return the JSON object with the extracted information.`;

        if (!OPENAI_API_KEY) {
            return {
                success: false,
                error: 'OpenAI API key not configured',
                data: null
            };
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.1, // Low temperature for consistent extraction
                max_tokens: 200
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Parse the JSON response
        let extractedData;
        try {
            extractedData = JSON.parse(content);
        } catch (parseError) {
            // If JSON parsing fails, try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                extractedData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Could not parse JSON from GPT-4 response');
            }
        }

        // Validate and structure the response
        return {
            success: true,
            data: {
                weight_oz: extractedData.weight_oz || null,
                slices: extractedData.slices || null,
                sandwiches_per_package: extractedData.sandwiches_per_package || null,
                price_usd: extractedData.price_usd || null,
                confidence: extractedData.confidence || 0.5,
                extracted_text: extractedData.extracted_text || 'Information extracted'
            }
        };
    } catch (error) {
        console.error('Error extracting package info:', error);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

// Export for different deployment environments

// For Vercel serverless functions (default export)
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Parse request body - Vercel may not auto-parse in some cases
        let body = req.body;
        if (typeof body === 'string' || !body) {
            try {
                body = JSON.parse(req.body || '{}');
            } catch (e) {
                // If body is already parsed or empty, use as-is
                body = req.body || {};
            }
        }

        const { text, ingredientType } = body;

        if (!text || !ingredientType) {
            res.status(400).json({ error: 'Missing required fields: text and ingredientType' });
            return;
        }

        const result = await extractPackageInfo(text, ingredientType);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// For Node.js/Express
if (typeof exports !== 'undefined') {
    exports.extractPackageInfo = extractPackageInfo;
    exports.handler = async (req, res) => {
        const { text, ingredientType } = req.body;
        const result = await extractPackageInfo(text, ingredientType);
        res.json(result);
    };
}
