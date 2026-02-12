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
 * Find optimal sandwich quantities that align with package sizes to minimize waste.
 * The ingredient with the largest per-package increment "wins" — making smaller
 * increments would leave partial packages of the larger ingredient unused.
 */
function getOptimalQuantities(target, packagingSizes) {
    // packagingSizes: array of { name, sandwichesPerPkg }
    // Find the LCM-like optimal increment
    // The largest package size drives the increment
    const sizes = packagingSizes.map(p => p.sandwichesPerPkg).filter(s => s > 0);
    if (sizes.length === 0) return [];

    // Sort descending — largest package drives the base increment
    const sorted = [...sizes].sort((a, b) => b - a);
    const baseIncrement = sorted[0]; // largest package size

    // Find multiples of the base increment near the target
    const suggestions = [];
    const lowerMultiple = Math.floor(target / baseIncrement) * baseIncrement;
    const upperMultiple = lowerMultiple + baseIncrement;

    // Check candidates: one below, one above, and if there's a sweet spot
    // where ALL ingredients align, prefer that
    const candidates = new Set();

    // Add multiples of the largest increment near the target
    if (lowerMultiple > 0) candidates.add(lowerMultiple);
    candidates.add(upperMultiple);

    // Also check if there's an LCM of the two largest sizes nearby
    if (sizes.length >= 2) {
        const lcm = lcmOf(sorted[0], sorted[1]);
        const lowerLcm = Math.floor(target / lcm) * lcm;
        const upperLcm = lowerLcm + lcm;
        if (lowerLcm > 0) candidates.add(lowerLcm);
        candidates.add(upperLcm);
    }

    // Score each candidate
    for (const count of candidates) {
        if (count <= 0 || count > target * 2) continue;

        let totalWaste = 0;
        const wasteDetails = [];
        for (const pkg of packagingSizes) {
            const pkgsNeeded = Math.ceil(count / pkg.sandwichesPerPkg);
            const capacity = pkgsNeeded * pkg.sandwichesPerPkg;
            const waste = capacity - count;
            totalWaste += waste;
            wasteDetails.push({
                ingredient: pkg.name,
                packages: pkgsNeeded,
                waste: waste
            });
        }

        suggestions.push({
            quantity: count,
            totalWaste,
            wasteDetails,
            diff: count - target,
            isZeroWaste: totalWaste === 0
        });
    }

    // Sort: zero-waste first, then by closeness to target
    suggestions.sort((a, b) => {
        if (a.isZeroWaste && !b.isZeroWaste) return -1;
        if (!a.isZeroWaste && b.isZeroWaste) return 1;
        return Math.abs(a.diff) - Math.abs(b.diff);
    });

    // Return top 2-3 unique suggestions, skip if same as target
    return suggestions
        .filter(s => s.quantity !== target)
        .slice(0, 3);
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcmOf(a, b) { return (a * b) / gcd(a, b); }

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

    // Get optimal quantity suggestions based on package sizes
    const packagingSizes = [
        { name: 'meat', sandwichesPerPkg: sandwichesPerMeatPkg },
        { name: 'cheese', sandwichesPerPkg: sandwichesPerCheesePkg },
        { name: 'bread', sandwichesPerPkg: sandwichesPerBreadPkg }
    ];

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

        const suggestedQuantities = getOptimalQuantities(targetSandwiches, packagingSizes);

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
            },
            packaging: {
                sandwichesPerMeatPkg,
                sandwichesPerCheesePkg,
                sandwichesPerBreadPkg
            },
            suggestedQuantities
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

        const suggestedQuantities = getOptimalQuantities(maxSandwiches, packagingSizes);

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
            },
            packaging: {
                sandwichesPerMeatPkg,
                sandwichesPerCheesePkg,
                sandwichesPerBreadPkg
            },
            suggestedQuantities
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

    const packagingSizes = [
        { name: 'peanut butter', sandwichesPerPkg: sandwichesPerPBJar },
        { name: 'jelly', sandwichesPerPkg: sandwichesPerJellyJar },
        { name: 'bread', sandwichesPerPkg: sandwichesPerBreadPkg }
    ];

    if (mode === 'sandwiches') {
        const targetSandwiches = parseInt(targetValue);

        const pbJars = Math.ceil(targetSandwiches / sandwichesPerPBJar);
        const jellyJars = Math.ceil(targetSandwiches / sandwichesPerJellyJar);
        const breadPackages = Math.ceil(targetSandwiches / sandwichesPerBreadPkg);

        const pbCost = pbJars * (peanutButter?.price || 3.50);
        const jellyCost = jellyJars * (jelly?.price || 2.50);
        const breadCost = breadPackages * (bread?.price || 2.00);
        const totalCost = pbCost + jellyCost + breadCost;

        const suggestedQuantities = getOptimalQuantities(targetSandwiches, packagingSizes);

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
            },
            packaging: {
                sandwichesPerPBJar,
                sandwichesPerJellyJar,
                sandwichesPerBreadPkg
            },
            suggestedQuantities
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

        const suggestedQuantities = getOptimalQuantities(maxSandwiches, packagingSizes);

        return {
            mode: 'budget',
            budget,
            maxSandwiches,
            peanutButterJars: pbJars,
            jellyJars,
            breadPackages,
            totalCost,
            costPerSandwich: maxSandwiches > 0 ? totalCost / maxSandwiches : 0,
            remainingBudget: budget - totalCost,
            packaging: {
                sandwichesPerPBJar,
                sandwichesPerJellyJar,
                sandwichesPerBreadPkg
            },
            suggestedQuantities
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

PACKAGING OPTIMIZATION (IMPORTANT):
- Suggest quantities that use full packages to minimize waste
- The ingredient with the LARGEST sandwiches-per-package drives the ideal increment
- Example: if meat makes 20 sandwiches/pkg and cheese makes 12/pkg, the LCM or a multiple of the larger package is ideal
- If a nearby quantity uses full packages of ALL ingredients with zero waste, strongly recommend it
- Single bread loaves make 10-12 sandwiches, double loaves make 20-24
- Always explain WHY a suggested quantity is better (e.g., "uses exactly 5 full packages of meat and 4 full packages of cheese with nothing left over")

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

PACKAGE SIZES:
${calculations.packaging ? Object.entries(calculations.packaging).map(([k, v]) => `- ${k}: ${v} sandwiches per package`).join('\n') : 'Not available'}

${calculations.suggestedQuantities && calculations.suggestedQuantities.length > 0 ? `
SUGGESTED OPTIMAL QUANTITIES (to minimize waste):
${calculations.suggestedQuantities.map(s => `- ${s.quantity} sandwiches: ${s.isZeroWaste ? 'ZERO WASTE - uses full packages of everything!' : `${s.totalWaste} leftover sandwich-equivalents of waste`} (${s.diff > 0 ? '+' : ''}${s.diff} from target)`).join('\n')}
` : ''}

Provide helpful insights. If any suggested quantities are close to the target and reduce waste, STRONGLY recommend them in your recommendations. Explain which package sizes drive the suggestion.`;

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
            suggestedQuantities: calculations.suggestedQuantities || [],
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

    const recommendations = [];

    // Add packaging-optimized quantity suggestions
    if (calculations.suggestedQuantities && calculations.suggestedQuantities.length > 0) {
        const best = calculations.suggestedQuantities[0];
        if (best.isZeroWaste) {
            recommendations.push(
                `Consider making ${best.quantity} instead of ${totalSandwiches} — this uses full packages of all ingredients with zero waste (${best.diff > 0 ? '+' : ''}${best.diff} sandwiches)`
            );
        } else if (best.totalWaste < (calculations.extras ? calculations.extras.meatSlices + calculations.extras.cheeseSlices + calculations.extras.breadSandwiches : 999)) {
            recommendations.push(
                `Making ${best.quantity} sandwiches would reduce ingredient waste (${best.diff > 0 ? '+' : ''}${best.diff} from your target)`
            );
        }
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
        recommendations,
        wasteReduction: calculations.extras?.breadSandwiches > 5
            ? `You have capacity for ${calculations.extras.breadSandwiches} extra sandwiches - consider making them to reduce waste!`
            : null,
        shoppingTip: 'Check store apps for digital coupons before shopping',
        volunteerEstimate,
        suggestedQuantities: calculations.suggestedQuantities || [],
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