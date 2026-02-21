/**
 * LLM-Powered Sandwich Calculator API
 *
 * This endpoint receives calculator inputs and returns:
 * - Validated calculations with sanity checks
 * - Math verification against frontend-computed quantities
 * - Smart recommendations for better value
 * - Waste minimization suggestions
 * - Budget optimization tips
 * - Shopping tips and reminders
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Product database — synced with frontend packageData in redesignedinventorycalculator.html
const PRODUCT_DATABASE = {
    meat: {
        // Turkey options
        'kroger-turkey-family': { weightOz: 16, price: 4.39, name: 'Kroger Turkey Family Size', type: 'turkey', store: 'Kroger' },
        'kroger-turkey-thin': { weightOz: 9, price: 3.99, name: 'Kroger Turkey Thin Sliced', type: 'turkey', store: 'Kroger' },
        'publix-turkey': { weightOz: 16, price: 7.07, name: 'Publix Turkey Breast', type: 'turkey', store: 'Publix' },
        'kirkland-turkey': { weightOz: 32, price: 13.99, name: 'Kirkland Turkey', type: 'turkey', store: "Sam's Club/Costco" },
        'land-o-frost-turkey': { weightOz: 16, price: 9.53, name: "Land O'Frost Turkey", type: 'turkey', store: 'Various' },
        'hillshire-turkey': { weightOz: 9, price: 6.07, name: 'Hillshire Farm Turkey', type: 'turkey', store: 'Various' },
        'oscar-mayer-turkey': { weightOz: 32, price: 9.97, name: "Oscar Mayer Turkey (Sam's Club)", type: 'turkey', store: "Sam's Club" },
        // Ham options
        'kirkland-ham': { slices: 96, price: 9.89, name: 'Kirkland Ham (2-pack)', type: 'ham', store: "Sam's Club/Costco" },
        'kroger-ham': { weightOz: 16, price: 4.99, name: 'Kroger Ham', type: 'ham', store: 'Kroger' },
        'hillshire-ham': { weightOz: 9, price: 5.49, name: 'Hillshire Farm Ham', type: 'ham', store: 'Various' },
        // Chicken options
        'kroger-chicken-thin': { weightOz: 9, price: 3.50, name: 'Kroger Chicken Thin', type: 'chicken', store: 'Kroger' },
        'oscar-mayer-chicken-rotisserie': { weightOz: 16, price: 7.99, name: 'Oscar Mayer Rotisserie Chicken', type: 'chicken', store: 'Various' },
        'oscar-mayer-chicken-blackened': { weightOz: 8, price: 4.49, name: 'Oscar Mayer Blackened Chicken', type: 'chicken', store: 'Various' },
    },
    cheese: {
        'boars-head-american': { slices: 24, price: 8.99, name: "Boar's Head American", store: 'Various' },
        'land-o-lakes-american': { slices: 24, price: 6.49, name: "Land O'Lakes American", store: 'Various' },
        'sargento-american': { slices: 22, price: 4.99, name: 'Sargento Sliced American', store: 'Various' },
        'great-value-american': { slices: 24, price: 3.98, name: 'Great Value American (Walmart)', store: 'Walmart' },
        'kroger-american': { slices: 24, price: 4.29, name: 'Kroger Deli American', store: 'Kroger' },
    },
    bread: {
        'great-value-white': { sandwiches: 11, price: 1.48, name: 'Great Value White', store: 'Walmart' },
        'kroger-white': { sandwiches: 11, price: 1.50, name: 'Kroger White Sandwich', store: 'Kroger' },
        'wonder-classic': { sandwiches: 10, price: 3.63, name: 'Wonder Bread Classic White', store: 'Various' },
        'wonder-giant': { sandwiches: 11, price: 4.64, name: 'Wonder Bread Giant White', store: 'Various' },
        'sara-lee-butter': { sandwiches: 10, price: 3.14, name: 'Sara Lee Butter Bread', store: 'Various' },
        'sara-lee-classic': { sandwiches: 10, price: 3.99, name: 'Sara Lee Classic White', store: 'Various' },
    }
};

// Standard recipe constants — synced with frontend defaults
const RECIPE = {
    deli: {
        meatOzPerSandwich: 2.5,         // matches frontend default input
        cheeseSlicesPerSandwich: 2,      // matches frontend
        meatSlicesPerSandwich: 3,        // fallback for slice-based meat
        avgMeatSliceWeightOz: 0.75,     // fallback for slice-based meat
    },
    pbj: {
        pbTbspPerSandwich: 3,            // matches frontend
        jellyTbspPerSandwich: 1.5,       // matches frontend
        pbServingsPerJar: 25,
        jellyServingsPerJar: 30,
    }
};

/**
 * Find optimal sandwich quantities that align with package sizes to minimize waste.
 */
function getOptimalQuantities(target, packagingSizes) {
    const sizes = packagingSizes.map(p => p.sandwichesPerPkg).filter(s => s > 0);
    if (sizes.length === 0) return [];

    const sorted = [...sizes].sort((a, b) => b - a);
    const baseIncrement = sorted[0];

    const lowerMultiple = Math.floor(target / baseIncrement) * baseIncrement;
    const upperMultiple = lowerMultiple + baseIncrement;

    const candidates = new Set();
    if (lowerMultiple > 0) candidates.add(lowerMultiple);
    candidates.add(upperMultiple);

    if (sizes.length >= 2) {
        const lcm = lcmOf(sorted[0], sorted[1]);
        const lowerLcm = Math.floor(target / lcm) * lcm;
        const upperLcm = lowerLcm + lcm;
        if (lowerLcm > 0) candidates.add(lowerLcm);
        candidates.add(upperLcm);
    }

    const suggestions = [];
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

    suggestions.sort((a, b) => {
        if (a.isZeroWaste && !b.isZeroWaste) return -1;
        if (!a.isZeroWaste && b.isZeroWaste) return 1;
        return Math.abs(a.diff) - Math.abs(b.diff);
    });

    return suggestions
        .filter(s => s.quantity !== target)
        .slice(0, 3);
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcmOf(a, b) { return (a * b) / gcd(a, b); }

/**
 * Verify frontend's computed quantities against independent backend math.
 * Returns a verification object with pass/fail status and specific discrepancies.
 */
function verifyFrontendMath(inputs) {
    const fe = inputs.frontendResults;
    if (!fe) {
        return { status: 'skipped', reason: 'No frontend results provided for verification' };
    }

    const checks = [];
    const totalSandwiches = fe.totalSandwiches;

    if (!totalSandwiches || totalSandwiches <= 0) {
        return { status: 'skipped', reason: 'Invalid sandwich count' };
    }

    if (inputs.sandwichType === 'deli') {
        const md = fe.mathDetails || {};
        const rawQuantities = fe.quantities || {};

        // Extract counts and costs — frontend sends { meat: { count, cost }, ... }
        const meatCount = typeof rawQuantities.meat === 'object' ? rawQuantities.meat.count : rawQuantities.meat;
        const cheeseCount = typeof rawQuantities.cheese === 'object' ? rawQuantities.cheese.count : rawQuantities.cheese;
        const breadCount = typeof rawQuantities.bread === 'object' ? rawQuantities.bread.count : rawQuantities.bread;
        const meatCost = typeof rawQuantities.meat === 'object' ? rawQuantities.meat.cost : rawQuantities.meatCost;
        const cheeseCost = typeof rawQuantities.cheese === 'object' ? rawQuantities.cheese.cost : rawQuantities.cheeseCost;
        const breadCost = typeof rawQuantities.bread === 'object' ? rawQuantities.bread.cost : rawQuantities.breadCost;
        const bagCost = typeof rawQuantities.bags === 'object' ? rawQuantities.bags.cost : (rawQuantities.bagCost || 0);

        // Check 1: Verify meat packages
        if (md.meatSandwichesPerPkg && meatCount != null) {
            const expected = Math.ceil(totalSandwiches / md.meatSandwichesPerPkg);
            checks.push({
                check: 'meatPackages',
                label: 'Meat packages',
                frontendValue: meatCount,
                expectedValue: expected,
                pass: meatCount === expected,
                formula: `ceil(${totalSandwiches} sandwiches / ${md.meatSandwichesPerPkg.toFixed(2)} per pkg) = ${expected}`
            });
        }

        // Check 2: Verify cheese packages
        if (md.cheeseSandwichesPerPkg && cheeseCount != null) {
            const expected = Math.ceil(totalSandwiches / md.cheeseSandwichesPerPkg);
            checks.push({
                check: 'cheesePackages',
                label: 'Cheese packages',
                frontendValue: cheeseCount,
                expectedValue: expected,
                pass: cheeseCount === expected,
                formula: `ceil(${totalSandwiches} sandwiches / ${md.cheeseSandwichesPerPkg} per pkg) = ${expected}`
            });
        }

        // Check 3: Verify bread packages
        if (md.breadSandwichesPerPkg && breadCount != null) {
            const expected = Math.ceil(totalSandwiches / md.breadSandwichesPerPkg);
            checks.push({
                check: 'breadPackages',
                label: 'Bread packages',
                frontendValue: breadCount,
                expectedValue: expected,
                pass: breadCount === expected,
                formula: `ceil(${totalSandwiches} sandwiches / ${md.breadSandwichesPerPkg} per pkg) = ${expected}`
            });
        }

        // Check 4: Cost per sandwich is reasonable
        if (fe.costPerSandwich != null) {
            const reasonable = fe.costPerSandwich >= 0.50 && fe.costPerSandwich <= 5.00;
            checks.push({
                check: 'costPerSandwich',
                label: 'Cost per sandwich reasonable',
                frontendValue: fe.costPerSandwich,
                pass: reasonable,
                formula: `$${fe.costPerSandwich.toFixed(2)} should be between $0.50 and $5.00`
            });
        }

        // Check 5: Total cost = sum of item costs
        if (meatCost != null && cheeseCost != null && breadCost != null) {
            const summed = meatCost + cheeseCost + breadCost + (bagCost || 0);
            const diff = Math.abs(fe.totalCost - summed);
            checks.push({
                check: 'costConsistency',
                label: 'Total cost matches item sum',
                frontendValue: Math.round(fe.totalCost * 100) / 100,
                expectedValue: Math.round(summed * 100) / 100,
                pass: diff < 0.02 * totalSandwiches, // allow small rounding per sandwich
                formula: `$${meatCost.toFixed(2)} + $${cheeseCost.toFixed(2)} + $${breadCost.toFixed(2)} + $${(bagCost || 0).toFixed(2)} = $${summed.toFixed(2)}`
            });
        }

        // Check 6: Meat packages cover the target
        if (md.meatSandwichesPerPkg && meatCount != null) {
            const covers = Math.floor(meatCount * md.meatSandwichesPerPkg);
            checks.push({
                check: 'meatCoverage',
                label: 'Meat covers target',
                frontendValue: covers,
                expectedValue: totalSandwiches,
                pass: covers >= totalSandwiches,
                formula: `${meatCount} pkgs × ${md.meatSandwichesPerPkg.toFixed(2)} = ${covers} sandwiches (need ${totalSandwiches})`
            });
        }

        // Check 7: Cheese packages cover the target
        if (md.cheeseSandwichesPerPkg && cheeseCount != null) {
            const covers = cheeseCount * md.cheeseSandwichesPerPkg;
            checks.push({
                check: 'cheeseCoverage',
                label: 'Cheese covers target',
                frontendValue: covers,
                expectedValue: totalSandwiches,
                pass: covers >= totalSandwiches,
                formula: `${cheeseCount} pkgs × ${md.cheeseSandwichesPerPkg} = ${covers} sandwiches (need ${totalSandwiches})`
            });
        }

    } else if (inputs.sandwichType === 'pbj') {
        const md = fe.mathDetails || {};
        const quantities = fe.quantities || {};

        // Check PB jars
        if (md.pbTbspPerJar && md.pbTbspPerSandwich && quantities.pbJars != null) {
            const servingsPerJar = Math.floor(md.pbTbspPerJar / md.pbTbspPerSandwich);
            const expected = Math.ceil(totalSandwiches / servingsPerJar);
            checks.push({
                check: 'pbJars',
                label: 'Peanut butter jars',
                frontendValue: quantities.pbJars,
                expectedValue: expected,
                pass: quantities.pbJars === expected,
                formula: `ceil(${totalSandwiches} / ${servingsPerJar} per jar) = ${expected}`
            });
        }

        // Check jelly jars
        if (md.jellyTbspPerJar && md.jellyTbspPerSandwich && quantities.jellyJars != null) {
            const servingsPerJar = Math.floor(md.jellyTbspPerJar / md.jellyTbspPerSandwich);
            const expected = Math.ceil(totalSandwiches / servingsPerJar);
            checks.push({
                check: 'jellyJars',
                label: 'Jelly jars',
                frontendValue: quantities.jellyJars,
                expectedValue: expected,
                pass: quantities.jellyJars === expected,
                formula: `ceil(${totalSandwiches} / ${servingsPerJar} per jar) = ${expected}`
            });
        }

        // Check bread loaves
        if (md.usableBreadSlicesPerLoaf && md.breadSlicesPerSandwich && quantities.breadLoaves != null) {
            const sandwichesPerLoaf = Math.floor(md.usableBreadSlicesPerLoaf / md.breadSlicesPerSandwich);
            const expected = Math.ceil(totalSandwiches / sandwichesPerLoaf);
            checks.push({
                check: 'breadLoaves',
                label: 'Bread loaves',
                frontendValue: quantities.breadLoaves,
                expectedValue: expected,
                pass: quantities.breadLoaves === expected,
                formula: `ceil(${totalSandwiches} / ${sandwichesPerLoaf} per loaf) = ${expected}`
            });
        }

        // Check cost is reasonable for PBJ
        if (fe.costPerSandwich != null) {
            const reasonable = fe.costPerSandwich >= 0.20 && fe.costPerSandwich <= 2.00;
            checks.push({
                check: 'costPerSandwich',
                label: 'Cost per sandwich reasonable',
                frontendValue: fe.costPerSandwich,
                pass: reasonable,
                formula: `$${fe.costPerSandwich.toFixed(2)} should be between $0.20 and $2.00`
            });
        }
    }

    const failedChecks = checks.filter(c => !c.pass);

    return {
        status: failedChecks.length === 0 ? 'pass' : 'fail',
        totalChecks: checks.length,
        passedChecks: checks.length - failedChecks.length,
        failedChecks: failedChecks.length,
        checks: checks,
        discrepancies: failedChecks.map(c => ({
            check: c.check,
            label: c.label,
            message: c.expectedValue != null
                ? `Expected ${c.expectedValue}, got ${c.frontendValue}`
                : c.formula,
            frontendValue: c.frontendValue,
            expectedValue: c.expectedValue
        }))
    };
}

/**
 * Calculate sandwich order with LLM-powered insights and math verification
 */
async function calculateWithLLM(inputs) {
    const {
        mode,
        targetValue,
        sandwichType,
        meat,
        cheese,
        bread,
        peanutButter,
        jelly,
    } = inputs;

    // Perform basic calculations first
    let calculations;
    if (sandwichType === 'deli') {
        calculations = calculateDeliOrder(mode, targetValue, meat, cheese, bread);
    } else {
        calculations = calculatePBJOrder(mode, targetValue, peanutButter, jelly, bread);
    }

    // Verify frontend math if frontend results were provided
    const verification = verifyFrontendMath(inputs);

    // Get LLM insights (pass verification so LLM can reference it)
    const llmInsights = await getLLMInsights(inputs, calculations, verification);

    return {
        success: true,
        calculations,
        insights: llmInsights,
        verification: verification,
        timestamp: new Date().toISOString()
    };
}

/**
 * Calculate deli sandwich order — uses oz-based math to match frontend
 */
function calculateDeliOrder(mode, targetValue, meat, cheese, bread) {
    // Use meatOzPerSandwich from frontend if provided, else use RECIPE default
    const meatOzPerSandwich = meat?.meatOzPerSandwich || RECIPE.deli.meatOzPerSandwich;
    const cheeseSlicesPerSandwich = RECIPE.deli.cheeseSlicesPerSandwich;

    // Calculate sandwiches per meat package — oz-based (matching frontend)
    let sandwichesPerMeatPkg;
    if (meat.weightOz) {
        // NO Math.floor — match frontend's exact division
        sandwichesPerMeatPkg = meat.weightOz / meatOzPerSandwich;
    } else if (meat.slices) {
        sandwichesPerMeatPkg = meat.slices / RECIPE.deli.meatSlicesPerSandwich;
    }

    const sandwichesPerCheesePkg = Math.floor(cheese.slices / cheeseSlicesPerSandwich);
    const sandwichesPerBreadPkg = bread.sandwiches || 10;

    const packagingSizes = [
        { name: 'meat', sandwichesPerPkg: Math.floor(sandwichesPerMeatPkg) },
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

        const maxFromMeat = meatPackages * sandwichesPerMeatPkg;
        const maxFromCheese = cheesePackages * sandwichesPerCheesePkg;
        const maxFromBread = breadPackages * sandwichesPerBreadPkg;
        const actualMax = Math.min(Math.floor(maxFromMeat), maxFromCheese, maxFromBread);

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
                breadSandwiches: extraBreadSandwiches
            },
            breakdown: {
                meatCost: meatPackages * meat.price,
                cheeseCost: cheesePackages * cheese.price,
                breadCost: breadPackages * bread.price
            },
            packaging: {
                sandwichesPerMeatPkg: Math.floor(sandwichesPerMeatPkg),
                sandwichesPerCheesePkg,
                sandwichesPerBreadPkg
            },
            suggestedQuantities
        };
    } else {
        // Budget mode
        const budget = parseFloat(targetValue);

        const meatCostPerSandwich = meat.price / sandwichesPerMeatPkg;
        const cheeseCostPerSandwich = cheese.price / sandwichesPerCheesePkg;
        const breadCostPerSandwich = bread.price / sandwichesPerBreadPkg;
        const totalCostPerSandwich = meatCostPerSandwich + cheeseCostPerSandwich + breadCostPerSandwich;

        let maxSandwiches = Math.floor(budget / totalCostPerSandwich);

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
                sandwichesPerMeatPkg: Math.floor(sandwichesPerMeatPkg),
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
async function getLLMInsights(inputs, calculations, verification) {
    if (!OPENAI_API_KEY) {
        return getDefaultInsights(inputs, calculations, verification);
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
- Always explain WHY a suggested quantity is better

MATH VERIFICATION:
You will receive a "verification" section showing automated math checks.
- If all checks passed, briefly confirm the math is correct in your summary.
- If any checks FAILED, your "isValid" MUST be false, and you MUST include the discrepancies in your warnings. Be specific: mention exact numbers that don't match and which ingredient is affected.
- Even if checks pass, do a quick sanity check: does the cost per sandwich seem reasonable? Do the package counts make sense for the number of sandwiches?

Return JSON in this exact format:
{
  "isValid": true/false,
  "mathCheckSummary": "All 7 checks passed" or "2 of 7 checks failed: cheese packages insufficient",
  "summary": "One clear sentence about the order",
  "costAssessment": "great" | "good" | "fair" | "high",
  "warnings": ["warning if any issues"],
  "recommendations": ["actionable suggestion 1", "suggestion 2"],
  "wasteReduction": "tip to reduce waste if applicable, or null",
  "shoppingTip": "one helpful shopping tip",
  "volunteerEstimate": "X-Y volunteers for Z hours"
}`;

    // Build verification section for the prompt
    let verificationSection = '';
    if (verification && verification.status !== 'skipped') {
        verificationSection = `
MATH VERIFICATION (automated):
Status: ${verification.status.toUpperCase()} (${verification.passedChecks}/${verification.totalChecks} checks passed)
${verification.checks.map(c => `- ${c.label}: ${c.pass ? 'PASS' : 'FAIL'} — ${c.formula}`).join('\n')}
${verification.discrepancies.length > 0 ? '\nDISCREPANCIES:\n' + verification.discrepancies.map(d => `- ${d.label}: ${d.message}`).join('\n') : ''}
`;
    }

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
- Extra bread capacity: ${calculations.extras.breadSandwiches} sandwiches
` : ''}

PACKAGE SIZES:
${calculations.packaging ? Object.entries(calculations.packaging).map(([k, v]) => `- ${k}: ${v} sandwiches per package`).join('\n') : 'Not available'}

${calculations.suggestedQuantities && calculations.suggestedQuantities.length > 0 ? `
SUGGESTED OPTIMAL QUANTITIES (to minimize waste):
${calculations.suggestedQuantities.map(s => `- ${s.quantity} sandwiches: ${s.isZeroWaste ? 'ZERO WASTE - uses full packages of everything!' : `${s.totalWaste} leftover sandwich-equivalents of waste`} (${s.diff > 0 ? '+' : ''}${s.diff} from target)`).join('\n')}
` : ''}
${verificationSection}
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
            return getDefaultInsights(inputs, calculations, verification);
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
                return getDefaultInsights(inputs, calculations, verification);
            }
        }

        // If verification failed but LLM said valid, override
        if (verification && verification.status === 'fail') {
            insights.isValid = false;
        }

        return {
            isValid: insights.isValid ?? true,
            mathCheckSummary: insights.mathCheckSummary || null,
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
        return getDefaultInsights(inputs, calculations, verification);
    }
}

/**
 * Fallback insights when LLM is unavailable
 */
function getDefaultInsights(inputs, calculations, verification) {
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
    let isValid = true;
    let mathCheckSummary = null;

    // Incorporate verification results
    if (verification && verification.status !== 'skipped') {
        mathCheckSummary = `${verification.passedChecks}/${verification.totalChecks} math checks passed`;
        if (verification.failedChecks > 0) {
            isValid = false;
            mathCheckSummary += ': ' + verification.discrepancies.map(d => d.label).join(', ') + ' failed';
            verification.discrepancies.forEach(d => {
                warnings.push(`Math check failed — ${d.label}: ${d.message}`);
            });
        }
    }

    if (totalSandwiches > 300) {
        warnings.push('Large order - consider splitting into multiple shopping trips');
    }

    const recommendations = [];

    if (calculations.suggestedQuantities && calculations.suggestedQuantities.length > 0) {
        const best = calculations.suggestedQuantities[0];
        if (best.isZeroWaste) {
            recommendations.push(
                `Consider making ${best.quantity} instead of ${totalSandwiches} — this uses full packages of all ingredients with zero waste (${best.diff > 0 ? '+' : ''}${best.diff} sandwiches)`
            );
        } else if (best.totalWaste < (calculations.extras ? calculations.extras.breadSandwiches : 999)) {
            recommendations.push(
                `Making ${best.quantity} sandwiches would reduce ingredient waste (${best.diff > 0 ? '+' : ''}${best.diff} from your target)`
            );
        }
    }

    const volunteerEstimate = totalSandwiches > 50
        ? `${Math.ceil(totalSandwiches / 75)}-${Math.ceil(totalSandwiches / 50)} volunteers for 1.5-2 hours`
        : '2-3 volunteers for about 1 hour';

    return {
        isValid,
        mathCheckSummary,
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
    exports.verifyFrontendMath = verifyFrontendMath;
    exports.PRODUCT_DATABASE = PRODUCT_DATABASE;
}
