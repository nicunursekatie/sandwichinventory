/**
 * Live Prices API - Kroger API + TSP Stored Prices
 *
 * Uses the Kroger Product API for real-time prices on products
 * available at Kroger. Falls back to TSP-maintained prices for
 * products not available through Kroger (Costco/Kirkland, Publix, etc.).
 */

const KROGER_CLIENT_ID = process.env.KROGER_CLIENT_ID;
const KROGER_CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET;

// Kroger UPC/search terms for each product key
// These help the Kroger API find the exact right product
const KROGER_PRODUCT_MAP = {
    // Turkey
    'kroger-turkey-family': { term: 'Kroger Turkey Breast Deli Thin Family Size', upc: '0001111097415' },
    'kroger-turkey-thin': { term: 'Kroger Turkey Breast Deli Thin Sliced 9 oz', upc: '0001111085080' },
    'hillshire-turkey': { term: 'Hillshire Farm Ultra Thin Turkey Breast 9 oz' },
    'land-o-frost-turkey': { term: "Land O'Frost Premium Turkey Breast 16 oz" },
    'oscar-mayer-turkey': { term: 'Oscar Mayer Turkey Breast deli meat 2 lb' },
    // Ham
    'kroger-ham': { term: 'Kroger Ham Deli Thin Sliced 16 oz' },
    'hillshire-ham': { term: 'Hillshire Farm Ultra Thin Ham 9 oz' },
    // Chicken
    'kroger-chicken-thin': { term: 'Kroger Chicken Breast Deli Thin Sliced 9 oz', upc: '0001111097725' },
    'kroger-chicken-deli': { term: 'Kroger Deli Style Oven Roasted Chicken Breast 16 oz' },
    'oscar-mayer-chicken-rotisserie': { term: 'Oscar Mayer Rotisserie Chicken Breast 16 oz' },
    'oscar-mayer-chicken-blackened': { term: 'Oscar Mayer Blackened Chicken 8 oz' },
    // Cheese
    'boars-head-american': { term: "Boar's Head American cheese slices" },
    'land-o-lakes-american': { term: "Land O'Lakes American cheese slices" },
    'sargento-american': { term: 'Sargento American cheese slices' },
    'kroger-american': { term: 'Kroger Deli American cheese slices' },
    // Bread
    'kroger-white': { term: 'Kroger White Sandwich Bread' },
    'wonder-classic': { term: 'Wonder Bread Classic White' },
    'wonder-giant': { term: 'Wonder Bread Giant White' },
    'sara-lee-butter': { term: 'Sara Lee Butter Bread' },
    'sara-lee-classic': { term: 'Sara Lee Classic White Bread' },
};

// Products NOT available at Kroger — always use TSP stored prices
const NON_KROGER_PRODUCTS = new Set([
    'kirkland-turkey',
    'kirkland-ham',
    'publix-turkey',
    'great-value-american',  // Walmart brand
    'great-value-white',     // Walmart brand
]);

// Fallback prices if Kroger API fails (last known good prices maintained by TSP)
const FALLBACK_PRICES = {
    // Meats
    'kroger-turkey-family': { price: 4.39, source: 'TSP stored' },
    'kirkland-turkey': { price: 13.99, source: 'TSP stored' },
    'kirkland-ham': { price: 9.89, source: 'TSP stored' },
    'oscar-mayer-turkey': { price: 9.97, source: 'TSP stored' },
    'kroger-turkey-thin': { price: 3.99, source: 'TSP stored' },
    'publix-turkey': { price: 7.07, source: 'TSP stored' },
    'land-o-frost-turkey': { price: 9.53, source: 'TSP stored' },
    'hillshire-turkey': { price: 6.07, source: 'TSP stored' },
    'kroger-ham': { price: 4.99, source: 'TSP stored' },
    'hillshire-ham': { price: 5.49, source: 'TSP stored' },
    'kroger-chicken-thin': { price: 4.99, source: 'TSP stored' },
    'kroger-chicken-deli': { price: 4.99, source: 'TSP stored' },
    'oscar-mayer-chicken-rotisserie': { price: 7.99, source: 'TSP stored' },
    'oscar-mayer-chicken-blackened': { price: 4.49, source: 'TSP stored' },

    // American Cheeses
    'boars-head-american': { price: 8.99, source: 'TSP stored' },
    'land-o-lakes-american': { price: 6.49, source: 'TSP stored' },
    'sargento-american': { price: 4.99, source: 'TSP stored' },
    'great-value-american': { price: 3.98, source: 'TSP stored' },
    'kroger-american': { price: 4.29, source: 'TSP stored' },

    // Bread
    'great-value-white': { price: 1.48, source: 'TSP stored' },
    'kroger-white': { price: 1.50, source: 'TSP stored' },
    'wonder-classic': { price: 3.63, source: 'TSP stored' },
    'wonder-giant': { price: 4.64, source: 'TSP stored' },
    'sara-lee-butter': { price: 3.14, source: 'TSP stored' },
    'sara-lee-classic': { price: 3.99, source: 'TSP stored' },

    // PB&J
    'jif-peanut-butter': { price: 3.50, source: 'TSP stored' },
    'skippy-peanut-butter': { price: 3.29, source: 'TSP stored' },
    'smuckers-jelly': { price: 2.99, source: 'TSP stored' },
    'welchs-jelly': { price: 2.79, source: 'TSP stored' }
};

/**
 * Get a Kroger API access token using client_credentials grant
 */
let cachedToken = null;
let tokenExpiry = 0;

async function getKrogerToken() {
    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && Date.now() < tokenExpiry - 60000) {
        return cachedToken;
    }

    const credentials = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        },
        body: 'grant_type=client_credentials&scope=product.compact'
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Kroger token error:', response.status, errorText);
        throw new Error(`Kroger auth failed: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    return cachedToken;
}

// Default Kroger store location for pricing (can be overridden per request)
const DEFAULT_LOCATION_ID = '01400943';

/**
 * Search for a product on the Kroger API and return its price
 */
async function searchKrogerProduct(token, productInfo, locationId) {
    const params = new URLSearchParams({
        'filter.term': productInfo.term,
        'filter.limit': '5',
        'filter.locationId': locationId || DEFAULT_LOCATION_ID
    });

    const response = await fetch(`https://api.kroger.com/v1/products?${params}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        console.error('Kroger product search error:', response.status);
        return null;
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
        return null;
    }

    // If we have a UPC, try to find exact match first
    if (productInfo.upc) {
        const exactMatch = data.data.find(p => p.upc === productInfo.upc);
        if (exactMatch && exactMatch.items && exactMatch.items[0]) {
            const price = exactMatch.items[0].price;
            if (price && (price.regular || price.promo)) {
                return {
                    price: price.promo || price.regular,
                    regularPrice: price.regular,
                    promoPrice: price.promo || null,
                    name: exactMatch.description,
                    upc: exactMatch.upc
                };
            }
        }
    }

    // Otherwise take the first result that has a price
    for (const product of data.data) {
        if (product.items && product.items[0] && product.items[0].price) {
            const price = product.items[0].price;
            if (price.regular || price.promo) {
                return {
                    price: price.promo || price.regular,
                    regularPrice: price.regular,
                    promoPrice: price.promo || null,
                    name: product.description,
                    upc: product.upc
                };
            }
        }
    }

    return null;
}

/**
 * Look up prices for all products — Kroger API for Kroger-available products,
 * TSP stored prices for everything else
 */
async function searchLivePrices(products, locationId) {
    const prices = {};
    let krogerToken = null;
    let krogerAvailable = false;

    // Try to get Kroger token
    if (KROGER_CLIENT_ID && KROGER_CLIENT_SECRET) {
        try {
            krogerToken = await getKrogerToken();
            krogerAvailable = true;
        } catch (error) {
            console.error('Could not get Kroger token:', error.message);
        }
    }

    // Process each product
    const krogerSearches = [];

    for (const product of products) {
        const key = product.key;

        // Non-Kroger products always use TSP stored prices
        if (NON_KROGER_PRODUCTS.has(key)) {
            prices[key] = {
                ...(FALLBACK_PRICES[key] || { price: 5.00, source: 'TSP stored' }),
                confidence: 0.8,
                source: 'TSP stored',
                notes: 'Price maintained by TSP team'
            };
            continue;
        }

        // If Kroger API is available and we have a search term, queue the search
        if (krogerAvailable && KROGER_PRODUCT_MAP[key]) {
            krogerSearches.push({ key, productInfo: KROGER_PRODUCT_MAP[key] });
        } else {
            // No Kroger mapping — use fallback
            prices[key] = getFallbackPrice(key);
        }
    }

    // Run all Kroger searches in parallel (batches of 5 to be nice to the API)
    if (krogerSearches.length > 0 && krogerToken) {
        const batchSize = 5;
        for (let i = 0; i < krogerSearches.length; i += batchSize) {
            const batch = krogerSearches.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async ({ key, productInfo }) => {
                    try {
                        const result = await searchKrogerProduct(krogerToken, productInfo, locationId);
                        return { key, result };
                    } catch (error) {
                        console.error(`Kroger search failed for ${key}:`, error.message);
                        return { key, result: null };
                    }
                })
            );

            for (const { key, result } of results) {
                if (result && result.price) {
                    prices[key] = {
                        price: parseFloat(result.price.toFixed(2)),
                        confidence: 0.95,
                        source: 'Kroger API',
                        notes: result.promoPrice
                            ? `${result.name} — on sale $${result.promoPrice.toFixed(2)} (reg $${result.regularPrice.toFixed(2)})`
                            : `${result.name} — Kroger.com`
                    };
                } else {
                    // Kroger search returned nothing — use fallback
                    prices[key] = getFallbackPrice(key);
                }
            }
        }
    }

    return prices;
}

/**
 * Get fallback price for a single product
 */
function getFallbackPrice(key) {
    if (FALLBACK_PRICES[key]) {
        return {
            ...FALLBACK_PRICES[key],
            confidence: 0.5,
            notes: 'Using stored price — could not fetch from Kroger'
        };
    }
    return {
        price: 5.00,
        confidence: 0.3,
        source: 'default',
        notes: 'Unknown product — using default estimate'
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

        const { products, locationId } = body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No products specified'
            });
            return;
        }

        // Limit the number of products to search (prevent abuse)
        const limitedProducts = products.slice(0, 30);

        // Search for live prices (locationId is optional — defaults to a central US Kroger)
        const prices = await searchLivePrices(limitedProducts, locationId);

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
