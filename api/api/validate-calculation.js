/**
 * API Endpoint for Validating Sandwich Calculator Results using GPT-4
 *
 * This endpoint reviews calculation results and provides:
 * - Sanity checks (are the numbers reasonable?)
 * - Warnings about potential issues
 * - Helpful tips and suggestions
 * - Confirmation that results look correct
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Validate calculation results using GPT-4
 * @param {Object} calculationData - The calculation inputs and results
 * @returns {Promise<Object>} Validation feedback
 */
async function validateCalculation(calculationData) {
    const systemPrompt = `You are a helpful assistant for The Sandwich Project, a nonprofit that helps groups make sandwiches for people in need.

Your job is to review sandwich calculator results and provide:
1. A quick sanity check - do these numbers make sense?
2. Any warnings about potential issues
3. Helpful tips based on the order size
4. Confirmation if everything looks good

Keep responses concise and friendly. Use simple language.

IMPORTANT BENCHMARKS for sanity checking:
- Cost per deli sandwich should be $1.50-$2.50 typically
- Cost per PB&J sandwich should be $0.50-$1.00 typically
- One person can make about 20-30 sandwiches per hour
- A standard folding table workspace fits 2-3 people
- Meat: ~2.5 oz per sandwich (3 slices)
- Cheese: 2 slices per sandwich
- Bread: 2 slices per sandwich

Return JSON in this exact format:
{
  "isValid": true/false,
  "confidence": 0.0-1.0,
  "summary": "One sentence summary of the results",
  "warnings": ["warning 1", "warning 2"] or [],
  "tips": ["tip 1", "tip 2"] or [],
  "costCheck": "normal" | "low" | "high",
  "message": "Brief friendly message to the user"
}`;

    const userPrompt = `Please review this sandwich calculation:

MODE: ${calculationData.mode}
${calculationData.mode === 'sandwiches'
    ? `TARGET: ${calculationData.targetSandwiches} sandwiches`
    : `BUDGET: $${calculationData.budget}`}

INGREDIENTS SELECTED:
- Meat: ${calculationData.meat?.name || 'Custom'} (${calculationData.meat?.weightOz ? calculationData.meat.weightOz + ' oz' : calculationData.meat?.slices + ' slices'}, $${calculationData.meat?.price || 'N/A'})
- Cheese: ${calculationData.cheese?.name || 'Custom'} (${calculationData.cheese?.slices} slices, $${calculationData.cheese?.price || 'N/A'})
- Bread: ${calculationData.bread?.name || 'Custom'} (${calculationData.bread?.sandwiches} sandwiches/pkg, $${calculationData.bread?.price || 'N/A'})

RESULTS:
- Total sandwiches: ${calculationData.results?.totalSandwiches || calculationData.results?.maxSandwiches}
- Total cost: $${calculationData.results?.totalCost?.toFixed(2)}
- Cost per sandwich: $${calculationData.results?.costPerSandwich?.toFixed(2)}
- Meat packages needed: ${calculationData.results?.meatPackages}
- Cheese packages needed: ${calculationData.results?.cheesePackages}
- Bread packages needed: ${calculationData.results?.breadPackages}

Please validate these results and provide feedback.`;

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
                temperature: 0.3,
                max_tokens: 400
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse the JSON response
        let validationData;
        try {
            validationData = JSON.parse(content);
        } catch (parseError) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                validationData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Could not parse JSON from GPT-4 response');
            }
        }

        return {
            success: true,
            data: {
                isValid: validationData.isValid ?? true,
                confidence: validationData.confidence ?? 0.8,
                summary: validationData.summary || 'Calculation reviewed',
                warnings: validationData.warnings || [],
                tips: validationData.tips || [],
                costCheck: validationData.costCheck || 'normal',
                message: validationData.message || 'Results look reasonable!'
            }
        };
    } catch (error) {
        console.error('Error validating calculation:', error);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

// Vercel serverless function handler
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
        let body = req.body;
        if (typeof body === 'string' || !body) {
            try {
                body = JSON.parse(req.body || '{}');
            } catch (e) {
                body = req.body || {};
            }
        }

        const result = await validateCalculation(body);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Export for testing
if (typeof exports !== 'undefined') {
    exports.validateCalculation = validateCalculation;
}