/**
 * LLM-Powered Sandwich Calculator API
 *
 * This endpoint receives calculator inputs and returns:
 * - Validated calculations with sanity checks
 * - Smart recommendations for better value
 * - Waste minimization suggestions
 * - Budget optimization tips
 * - Shopping tips and reminders
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Product database with current pricing
const PRODUCT_DATABASE = {
    meat: {
        'oscar-mayer-turkey': { weightOz: 32, price: 9.97, name: "Oscar Mayer Turkey (Sam's Club)", type: 'turkey', store: "Sam's Club" },
        'kroger-turkey-family': { weightOz: 16, price: 4.39, name: 'Kroger Turkey Family Size', type: 'turkey', store: 'Kroger' },
        'kroger-turkey-thin': { weightOz: 9, price: 3.99, name: 'Kroger Turkey Thin Sliced', type: 'turkey', store: 'Kroger' },
        'publix-turkey': { weightOz: 16, price: 7.07, name: 'Publix Turkey Breast', type: 'turkey', store: 'Publix' },
        'kirkland-turkey': { weightOz: 32, price: 13.99, name: 'Kirkland Turkey', type: 'turkey', store: "Sam's Club/Costco" },
        'land-o-frost-turkey': { weightOz: 16, price: 9.53, name: "Land O'Frost Turkey", type: 'turkey', store: 'Various' },
        'hillshire-turkey': { weightOz: 9, price: 6.07, name: 'Hillshire Farm Turkey', type: 'turkey', store: 'Various' },
        'kirkland-ham': { slices: 48, price: 9.89, name: 'Kirkland Ham', type: 'ham', store: "Sam's Club/Costco" },
        'kroger-ham': { weightOz: 16, price: 4.99, name: 'Kroger Ham', type: 'ham', store: 'Kroger' },
        'hillshire-ham': { weightOz: 9, price: 5.49, name: 'Hillshire Farm Ham', type: 'ham', store: 'Various' },
        'kroger-chicken-thin': { weightOz: 9, price: 3.50, name: 'Kroger Chicken Thin', type: 'chicken', store: 'Kroger' },
        'oscar-mayer-chicken-rotisserie': { weightOz: 16, price: 7.99, name: 'Oscar Mayer Rotisserie Chicken', type: 'chicken', store: 'Various' },
    },
    cheese: {
        'adams-reserve': { slices: 44, price: 7.70, name: 'Adams Reserve', store: 'Various' },
        'finlandia': { slices: 40, price: 9.69, name: 'Finlandia Variety', store: 'Various' },
        'arla-havarti': { slices: 32, price: 9.69, name: 'Arla Havarti', store: 'Various' },
    },
    bread: {
        'natures-own': { sandwiches: 10, price: 3.28, name: "Nature's Own Butter Bread", store: 'Various' },
        'wonder-bread': { sandwiches: 10, price: 2.98, name: 'Wonder Bread', store: 'Various' },
        'store-brand': { sandwiches: 10, price: 1.50, name: 'Store Brand White Bread', store: 'Various' },
    }
};

// Standard recipe constants
const RECIPE = {
    deli: {
        meatSlicesPerSandwich: 3,
        cheeseSlicesPerSandwich: 2,
        avgMeatSliceWeightOz: 0.75, // ~0.75 oz per slice for deli meat
    },
    pbj: {
        pbServingsPerJar: 25, // ~25 sandwiches per 16oz jar
        jellyServingsPerJar: 30, // ~30 sandwiches per 18oz jar
    }
};

/**
 * Calculate sandwich order with LLM-powered insights
 */
async function calculateWithLLM(inputs) {
    const {
        mode, // 'sandwiches' or 'budget'
        targetValue, // sandwich count or budget amount
        sandwichType, // 'deli' or 'pbj'
        meat, // { id, weightOz, price, slices } or custom
        cheese, // { id, slices, price } or custom
        bread, // { id, sandwiches, price } or custom
        peanutButter, // for PB&J
        jelly, // for PB&J
    } = inputs;

    // Perform basic calculations first
    let calculations;
    if (sandwichType === 'deli') {
        calculations = calculateDeliOrder(mode, targetValue, meat, cheese, bread);
    } else {
        calculations = calculatePBJOrder(mode, targetValue, peanutButter, jelly, bread);
    }

    // Now get LLM insights
    const llmInsights = await getLLMInsights(inputs, calculations);

    return {
        success: true,
        calculations,
        insights: llmInsights,
        timestamp: new Date().toISOString()
    };
}

/**
 * Calculate deli sandwich order
 */
function calculateDeliOrder(mode, targetValue, meat, cheese, bread) {
    const meatSlicesPerSandwich = RECIPE.deli.meatSlicesPerSandwich;
    const cheeseSlicesPerSandwich = RECIPE.deli.cheeseSlicesPerSandwich;

    // Calculate slices per meat package
    let meatSlicesPerPkg;
    if (meat.slices) {
        meatSlicesPerPkg = meat.slices;
    } else if (meat.weightOz) {
        meatSlicesPerPkg = Math.floor(meat.weightOz / RECIPE.deli.avgMeatSliceWeightOz);
    }

    const sandwichesPerMeatPkg = Math.floor(meatSlicesPerPkg / meatSlicesPerSandwich);
    const sandwichesPerCheesePkg = Math.floor(cheese.slices / cheeseSlicesPerSandwich);
    const sandwichesPerBreadPkg = bread.sandwiches || 10;

    if (mode === 'sandwiches') {
        const targetSandwiches = parseInt(targetValue);

        const meatPackages = Math.ceil(targetSandwiches / sandwichesPerMeatPkg);
        const cheesePackages = Math.ceil(targetSandwiches / sandwichesPerCheesePkg);
        const breadPackages = Math.ceil(targetSandwiches / sandwichesPerBreadPkg);

        const totalCost = (meatPackages * meat.price) +
                          (cheesePackages * cheese.price) +
                          (breadPackages * bread.price);

        const costPerSandwich = totalCost / targetSandwiches;

        // Calculate actual sandwiches possible (limited by smallest ingredient)
        const maxFromMeat = meatPackages * sandwichesPerMeatPkg;
        const maxFromCheese = cheesePackages * sandwichesPerCheesePkg;
        const maxFromBread = breadPackages * sandwichesPerBreadPkg;
        const actualMax = Math.min(maxFromMeat, maxFromCheese, maxFromBread);

        // Calculate waste/extras
        const extraMeatSlices = (meatPackages * meatSlicesPerPkg) - (targetSandwiches * meatSlicesPerSandwich);
        const extraCheeseSlices = (cheesePackages * cheese.slices) - (targetSandwiches * cheeseSlicesPerSandwich);
        const extraBreadSandwiches = (breadPackages * sandwichesPerBreadPkg) - targetSandwiches;

        return {
            mode: 'sandwiches',
            targetSandwiches,
            meatPackages,
            cheesePackages,
            breadPackages,
            totalCost,
            costPerSandwich,
            actualMaxSandwiches: actualMax,
            extras: {
                meatSlices: extraMeatSlices,
                cheeseSlices: extraCheeseSlices,
                breadSandwiches: extraBreadSandwiches
            },
            breakdown: {
                meatCost: meatPackages * meat.price,
                cheeseCost: cheesePackages * cheese.price,
                breadCost: breadPackages * bread.price
            }
        };
    } else {
        // Budget mode - find max sandwiches within budget
        const budget = parseFloat(targetValue);

        // Cost per sandwich from each ingredient
        const meatCostPerSandwich = meat.price / sandwichesPerMeatPkg;
        const cheeseCostPerSandwich = cheese.price / sandwichesPerCheesePkg;
        const breadCostPerSandwich = bread.price / sandwichesPerBreadPkg;
        const totalCostPerSandwich = meatCostPerSandwich + cheeseCostPerSandwich + breadCostPerSandwich;

        // Estimate max sandwiches
        let maxSandwiches = Math.floor(budget / totalCostPerSandwich);

        // Refine by checking actual package costs
        let meatPackages, cheesePackages, breadPackages, totalCost;
        do {
            meatPackages = Math.ceil(maxSandwiches / sandwichesPerMeatPkg);
            cheesePackages = Math.ceil(maxSandwiches / sandwichesPerCheesePkg);
            breadPackages = Math.ceil(maxSandwiches / sandwichesPerBreadPkg);
            totalCost = (meatPackages * meat.price) +
                        (cheesePackages * cheese.price) +
                        (breadPackages * bread.price);
            if (totalCost > budget) {
                maxSandwiches--;
            }
        } while (totalCost > budget && maxSandwiches > 0);

        return {
            mode: 'budget',
            budget,
            maxSandwiches,
            meatPackages,
            cheesePackages,
            breadPackages,
            totalCost,
            costPerSandwich: maxSandwiches > 0 ? totalCost / maxSandwiches : 0,
            remainingBudget: budget - totalCost,
            breakdown: {
                meatCost: meatPackages * meat.price,
                cheeseCost: cheesePackages * cheese.price,
                breadCost: breadPackages * bread.price
            }
        };
    }
}

/**
 * Calculate PB&J sandwich order
 */
function calculatePBJOrder(mode, targetValue, peanutButter, jelly, bread) {
    const sandwichesPerPBJar = peanutButter?.servings || RECIPE.pbj.pbServingsPerJar;
    const sandwichesPerJellyJar = jelly?.servings || RECIPE.pbj.jellyServingsPerJar;
    const sandwichesPerBreadPkg = bread?.sandwiches || 10;

    if (mode === 'sandwiches') {
        const targetSandwiches = parseInt(targetValue);

        const pbJars = Math.ceil(targetSandwiches / sandwichesPerPBJar);
        const jellyJars = Math.ceil(targetSandwiches / sandwichesPerJellyJar);
        const breadPackages = Math.ceil(targetSandwiches / sandwichesPerBreadPkg);

        const pbCost = pbJars * (peanutButter?.price || 3.50);
        const jellyCost = jellyJars * (jelly?.price || 2.50);
        const breadCost = breadPackages * (bread?.price || 2.00);
        const totalCost = pbCost + jellyCost + breadCost;

        return {
            mode: 'sandwiches',
            targetSandwiches,
            peanutButterJars: pbJars,
            jellyJars,
            breadPackages,
            totalCost,
            costPerSandwich: totalCost / targetSandwiches,
            breakdown: {
                peanutButterCost: pbCost,
                jellyCost,
                breadCost
            }
        };
    } else {
        // Budget mode for PB&J
        const budget = parseFloat(targetValue);
        const costPerSandwich = ((peanutButter?.price || 3.50) / sandwichesPerPBJar) +
                                ((jelly?.price || 2.50) / sandwichesPerJellyJar) +
                                ((bread?.price || 2.00) / sandwichesPerBreadPkg);

        const maxSandwiches = Math.floor(budget / costPerSandwich);

        const pbJars = Math.ceil(maxSandwiches / sandwichesPerPBJar);
        const jellyJars = Math.ceil(maxSandwiches / sandwichesPerJellyJar);
        const breadPackages = Math.ceil(maxSandwiches / sandwichesPerBreadPkg);

        const totalCost = (pbJars * (peanutButter?.price || 3.50)) +
                          (jellyJars * (jelly?.price || 2.50)) +
                          (breadPackages * (bread?.price || 2.00));

        return {
            mode: 'budget',
            budget,
            maxSandwiches,
            peanutButterJars: pbJars,
            jellyJars,
            breadPackages,
            totalCost,
            costPerSandwich: maxSandwiches > 0 ? totalCost / maxSandwiches : 0,
            remainingBudget: budget - totalCost
        };
    }
}

/**
 * Get LLM-powered insights and recommendations
 */
async function getLLMInsights(inputs, calculations) {
    if (!OPENAI_API_KEY) {
        return getDefaultInsights(inputs, calculations);
    }

    const systemPrompt = `You are a helpful assistant for The Sandwich Project, a nonprofit that coordinates groups making sandwiches for people in need.

Your job is to review sandwich order calculations and provide helpful, practical insights. Be concise and friendly.

IMPORTANT CONTEXT:
- These are bulk sandwich-making events, typically 50-500 sandwiches
- Cost efficiency matters - these are nonprofit/charity events
- Food safety is important - sandwiches must be stored properly
- Volunteers will be making these sandwiches assembly-line style
- Deli sandwiches: turkey/ham/chicken + cheese on bread
- PB&J: peanut butter and jelly on bread

BENCHMARKS:
- Good deli sandwich cost: $1.50-$2.00 each
- Good PB&J cost: $0.40-$0.70 each
- One volunteer makes ~20-30 sandwiches/hour
- Always round up packages (can't buy partial packages)

Return JSON in this exact format:
{
  "isValid": true/false,
  "summary": "One clear sentence about the order",
  "costAssessment": "great" | "good" | "fair" | "high",
  "warnings": ["warning if any issues"],
  "recommendations": ["actionable suggestion 1", "suggestion 2"],
  "wasteReduction": "tip to reduce waste if applicable, or null",
  "shoppingTip": "one helpful shopping tip",
  "volunteerEstimate": "X-Y volunteers for Z hours"
}`;

    const userPrompt = `Review this sandwich order calculation:

TYPE: ${inputs.sandwichType === 'deli' ? 'Deli Sandwiches' : 'PB&J Sandwiches'}
MODE: ${inputs.mode === 'sandwiches' ? `Making ${inputs.targetValue} sandwiches` : `$${inputs.targetValue} budget`}

${inputs.sandwichType === 'deli' ? `
INGREDIENTS:
- Meat: ${inputs.meat?.name || 'Custom'} - $${inputs.meat?.price}
- Cheese: ${inputs.cheese?.name || 'Custom'} - $${inputs.cheese?.price}
- Bread: ${inputs.bread?.name || 'Custom'} - $${inputs.bread?.price}
` : `
INGREDIENTS:
- Peanut Butter: $${inputs.peanutButter?.price || 3.50}
- Jelly: $${inputs.jelly?.price || 2.50}
- Bread: $${inputs.bread?.price || 2.00}
`}

RESULTS:
- Total sandwiches: ${calculations.targetSandwiches || calculations.maxSandwiches}
- Total cost: $${calculations.totalCost?.toFixed(2)}
- Cost per sandwich: $${calculations.costPerSandwich?.toFixed(2)}
${calculations.extras ? `
- Extra meat slices: ${calculations.extras.meatSlices}
- Extra cheese slices: ${calculations.extras.cheeseSlices}
- Extra bread capacity: ${calculations.extras.breadSandwiches} sandwiches
` : ''}

Provide helpful insights for this order.`;

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
                max_tokens: 500
            })
        });

        if (!response.ok) {
            console.error('OpenAI API error:', response.status);
            return getDefaultInsights(inputs, calculations);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        let insights;
        try {
            insights = JSON.parse(content);
        } catch (parseError) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                insights = JSON.parse(jsonMatch[0]);
            } else {
                return getDefaultInsights(inputs, calculations);
            }
        }

        return {
            isValid: insights.isValid ?? true,
            summary: insights.summary || 'Calculation complete',
            costAssessment: insights.costAssessment || 'good',
            warnings: insights.warnings || [],
            recommendations: insights.recommendations || [],
            wasteReduction: insights.wasteReduction || null,
            shoppingTip: insights.shoppingTip || null,
            volunteerEstimate: insights.volunteerEstimate || null,
            poweredByAI: true
        };
    } catch (error) {
        console.error('Error getting LLM insights:', error);
        return getDefaultInsights(inputs, calculations);
    }
}

/**
 * Fallback insights when LLM is unavailable
 */
function getDefaultInsights(inputs, calculations) {
    const totalSandwiches = calculations.targetSandwiches || calculations.maxSandwiches;
    const costPerSandwich = calculations.costPerSandwich;

    let costAssessment = 'good';
    if (inputs.sandwichType === 'deli') {
        if (costPerSandwich < 1.50) costAssessment = 'great';
        else if (costPerSandwich > 2.50) costAssessment = 'high';
    } else {
        if (costPerSandwich < 0.50) costAssessment = 'great';
        else if (costPerSandwich > 1.00) costAssessment = 'high';
    }

    const warnings = [];
    if (totalSandwiches > 300) {
        warnings.push('Large order - consider splitting into multiple shopping trips');
    }

    const volunteerHours = Math.ceil(totalSandwiches / 25);
    const volunteerEstimate = totalSandwiches > 50
        ? `${Math.ceil(totalSandwiches / 75)}-${Math.ceil(totalSandwiches / 50)} volunteers for 1.5-2 hours`
        : '2-3 volunteers for about 1 hour';

    return {
        isValid: true,
        summary: `Order for ${totalSandwiches} ${inputs.sandwichType === 'deli' ? 'deli' : 'PB&J'} sandwiches at $${costPerSandwich.toFixed(2)} each`,
        costAssessment,
        warnings,
        recommendations: [],
        wasteReduction: calculations.extras?.breadSandwiches > 5
            ? `You have capacity for ${calculations.extras.breadSandwiches} extra sandwiches - consider making them to reduce waste!`
            : null,
        shoppingTip: 'Check store apps for digital coupons before shopping',
        volunteerEstimate,
        poweredByAI: false
    };
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

        const result = await calculateWithLLM(body);
        res.status(200).json(result);
    } catch (error) {
        console.error('Calculation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Export for testing
if (typeof exports !== 'undefined') {
    exports.calculateWithLLM = calculateWithLLM;
    exports.calculateDeliOrder = calculateDeliOrder;
    exports.calculatePBJOrder = calculatePBJOrder;
    exports.PRODUCT_DATABASE = PRODUCT_DATABASE;
}