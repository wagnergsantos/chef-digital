const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../index.html');
let content;
try {
    content = fs.readFileSync(htmlPath, 'utf8');
} catch (e) {
    console.error("Could not read index.html");
    process.exit(1);
}

function extractFunction(funcName) {
    const startIdx = content.indexOf(`function ${funcName}`);
    if (startIdx === -1) {
        throw new Error(`Function ${funcName} not found in index.html`);
    }
    const openBraceIdx = content.indexOf('{', startIdx);
    if (openBraceIdx === -1) {
        throw new Error(`Open brace not found for function ${funcName}`);
    }
    let braceCount = 1;
    let i = openBraceIdx + 1;
    while (braceCount > 0 && i < content.length) {
        if (content[i] === '{') {
            braceCount++;
        } else if (content[i] === '}') {
            braceCount--;
        }
        i++;
    }
    return content.substring(openBraceIdx + 1, i - 1);
}

try {
    const scaleBody = extractFunction('scaleIngredientQty');
    const scaleIngredientQty = new Function('qty', 'activePortions', 'servings', scaleBody);

    console.log("Running servings logic tests...");
    
    // Test 1: Recipe without portions (servings null), multiplier 1x
    let res1 = scaleIngredientQty(100, 1, null);
    if (res1 !== 100) throw new Error(`Test 1 Failed: expected 100, got ${res1}`);

    // Test 2: Recipe without portions (servings null), multiplier 3x
    let res2 = scaleIngredientQty(150, 3, null);
    if (res2 !== 450) throw new Error(`Test 2 Failed: expected 450, got ${res2}`);

    // Test 3: Recipe with portions (servings = 4), scaled to 8 people
    let res3 = scaleIngredientQty(200, 8, 4);
    if (res3 !== 400) throw new Error(`Test 3 Failed: expected 400, got ${res3}`);

    // Test 4: Recipe with portions (servings = 4), scaled to 2 people
    let res4 = scaleIngredientQty(200, 2, 4);
    if (res4 !== 100) throw new Error(`Test 4 Failed: expected 100, got ${res4}`);

    // Test 5: Qty null (a gosto / opcional)
    let res5 = scaleIngredientQty(null, 5, 4);
    if (res5 !== null) throw new Error(`Test 5 Failed: expected null, got ${res5}`);

    console.log("All servings logic tests passed!");
} catch (err) {
    console.error("Test execution failed:", err.message);
    process.exit(1);
}
