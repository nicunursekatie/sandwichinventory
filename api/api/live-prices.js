/**
 * Live Prices API - AI-Powered Grocery Price Lookup
 *
 * This endpoint uses AI to search for current grocery prices
 * and return them in a format the frontend can use to update
 * the calculator's price database.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Fallback prices if AI search fails (last known good prices)
const FALLBACK_PRICES = {
    // Meats
    'kroger-turkey-family': { price: 4.39, source: 'fallback' },
    'kirkland-turkey': { price: 13.99, source: 'fallback' },
    'kirkland-ham': { price: 9.89, source: 'fallback' },
    'oscar-mayer-turkey': { price: 9.97, source: 'fallback' },
    'kroger-turkey-thin': { price: 3.99, source: 'fallback' },
    'publix-turkey': { price: 7.07, source: 'fallback' },
    'land-o-frost-turkey': { price: 9.53, source: 'fallback' },
    'hillshire-turkey': { price: 6.07, source: 'fallback' },
    'kroger-ham': { price: 4.99, source: 'fallback' },
    'hillshire-ham': { price: 5.49, source: 'fallback' },
    'kroger-chicken-thin': { price: 3.50, source: 'fallback' },
    'oscar-mayer-chicken-rotisserie': { price: 7.99, source: 'fallback' },

    // American Cheeses
    'boars-head-american': { price: 8.99, source: 'fallback' },
    'land-o-lakes-american': { price: 6.49, source: 'fallback' },
    'sargento-american': { price: 4.99, source: 'fallback' },
    'great-value-american': { price: 3.98, source: 'fallback' },
    'kroger-american': { price: 4.29, source: 'fallback' },

    // Other Cheeses
    'adams-reserve': { price: 7.70, source: 'fallback' },
    'finlandia': { price: 9.69, source: 'fallback' },
    'arla-havarti': { price: 9.69, source: 'fallback' },

    // Bread
    'great-value-white': { price: 1.48, source: 'fallback' },
    'kroger-white': { price: 1.50, source: 'fallback' },
    'wonder-classic': { price: 3.63, source: 'fallback' },
    'wonder-giant': { price: 4.64, source: 'fallback' },
    'sara-lee-butter': { price: 3.14, source: 'fallback' },
    'sara-lee-classic': { price: 3.99, source: 'fallback' },

    // PB&J
    'jif-peanut-butter': { price: 3.50, source: 'fallback' },
    'skippy-peanut-butter': { price: 3.29, source: 'fallback' },
    'smuckers-jelly': { price: 2.99, source: 'fallback' },
    'welchs-jelly': { price: 2.79, source: 'fallback' }
};

/**
 * Use OpenAI to search for current grocery prices
 */
async function searchLivePrices(products) {
    if (!OPENAI_API_KEY) {
        console.log('No OpenAI API key - using fallback prices');
        return getFallbackPrices(products);
    }

    const systemPrompt = `You are a helpful assistant that looks up current grocery store prices.

IMPORTANT: You are helping The Sandwich Project, a nonprofit that makes sandwiches for people in need.
They need accurate, current prices for deli meats, cheeses, and bread.

For each product requested, provide the current typical retail price in USD.
Look for prices at major retailers like Kroger, Walmart, Sam's Club, Costco, or Publix.

Return your response as a JSON object with this exact format:
{
  "prices": {
    "product-key": {
      "price": 4.99,
      "confidence": 0.8,
      "source": "Store name or 'estimated'",
      "notes": "Optional notes about the price"
    }
  },
  "searchDate": "2025-01-20"
}

Confidence levels:
- 0.9+ = Found exact current price from retailer
- 0.7-0.9 = Found recent price, may have changed slightly
- 0.5-0.7 = Estimated based on similar products
- Below 0.5 = Rough estimate only

If you cannot find a price, set confidence to 0 and provide your best estimate.`;

    const productList = products.map(p => `- ${p.key}: "${p.name}" (category: ${p.category})`).join('\n');

    const userPrompt = `Please look up current prices for these grocery items (January 2025):

${productList}

Return the prices in the JSON format specified. Focus on getting the most accurate current prices possible.`;

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
                temperature: 0.2,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            console.error('OpenAI API error:', response.status);
            return getFallbackPrices(products);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse the JSON response
        let aiResult;
        try {
            aiResult = JSON.parse(content);
        } catch (parseError) {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiResult = JSON.parse(jsonMatch[0]);
            } else {
                console.error('Failed to parse AI response');
                return getFallbackPrices(products);
            }
        }

        // Merge AI prices with fallbacks for any missing items
        const prices = {};
        for (const product of products) {
            if (aiResult.prices && aiResult.prices[product.key]) {
                const aiPrice = aiResult.prices[product.key];
                // Validate the price is reasonable
                if (aiPrice.price > 0 && aiPrice.price < 50) {
                    prices[product.key] = {
                        price: parseFloat(aiPrice.price.toFixed(2)),
                        confidence: aiPrice.confidence || 0.7,
                        source: aiPrice.source || 'AI search',
                        notes: aiPrice.notes
                    };
                } else {
                    // Use fallback if price seems unreasonable
                    prices[product.key] = getFallbackPrice(product.key);
                }
            } else {
                prices[product.key] = getFallbackPrice(product.key);
            }
        }

        return prices;
    } catch (error) {
        console.error('Error searching live prices:', error);
        return getFallbackPrices(products);
    }
}

/**
 * Get fallback price for a single product
 */
function getFallbackPrice(key) {
    if (FALLBACK_PRICES[key]) {
        return {
            ...FALLBACK_PRICES[key],
            confidence: 0.5,
            notes: 'Using stored price - could not fetch live price'
        };
    }
    return {
        price: 5.00,
        confidence: 0.3,
        source: 'default',
        notes: 'Unknown product - using default estimate'
    };
}

/**
 * Get fallback prices for all requested products
 */
function getFallbackPrices(products) {
    const prices = {};
    for (const product of products) {
        prices[product.key] = getFallbackPrice(product.key);
    }
    return prices;
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
        // Parse the request body
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                body = {};
            }
        }

        const { products } = body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No products specified'
            });
            return;
        }

        // Limit the number of products to search (prevent abuse)
        const limitedProducts = products.slice(0, 20);

        // Search for live prices
        const prices = await searchLivePrices(limitedProducts);

        res.status(200).json({
            success: true,
            prices,
            timestamp: new Date().toISOString(),
            productsSearched: limitedProducts.length
        });
    } catch (error) {
        console.error('Live prices error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Export for testing
if (typeof exports !== 'undefined') {
    exports.searchLivePrices = searchLivePrices;
    exports.FALLBACK_PRICES = FALLBACK_PRICES;
}
