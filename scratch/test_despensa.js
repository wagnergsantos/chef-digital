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
    const normalizeBody = extractFunction('normalizeSearchText');
    const recipeIsFullyStockedBody = extractFunction('recipeIsFullyStocked');

    const recipeIsFullyStocked = new Function('recipe', `
        function normalizeSearchText(str) {
            ${normalizeBody}
        }
        ${recipeIsFullyStockedBody}
    `);

    console.log("Running Despensa Logic tests...");

    // Test 1: Empty pantryItems
    global.pantryItems = [];
    const r1 = { ingredients: [{ name: "arroz", unit: "g" }] };
    const res1 = recipeIsFullyStocked(r1);
    if (res1 !== false) throw new Error("Test 1 Failed: empty pantry should return false");

    // Test 2: All ingredients match exactly
    global.pantryItems = ["arroz", "feijao"];
    const r2 = { ingredients: [{ name: "Arroz", unit: "g" }, { name: "feijão", unit: "g" }] };
    const res2 = recipeIsFullyStocked(r2);
    if (res2 !== true) throw new Error("Test 2 Failed: exact matches should return true");

    // Test 3: Some ingredients missing
    global.pantryItems = ["arroz"];
    const r3 = { ingredients: [{ name: "arroz", unit: "g" }, { name: "feijão", unit: "g" }] };
    const res3 = recipeIsFullyStocked(r3);
    if (res3 !== false) throw new Error("Test 3 Failed: missing ingredient should return false");

    // Test 4: Accent and case normalization
    global.pantryItems = ["pao de acucar", "CEBOLA"];
    const r4 = { ingredients: [{ name: "Pão de Açúcar", unit: "unidade" }, { name: "cebola", unit: "g" }] };
    const res4 = recipeIsFullyStocked(r4);
    if (res4 !== true) throw new Error("Test 4 Failed: normalized match should return true");

    // Test 5: "a gosto" or "opcional" ingredients always count as available
    global.pantryItems = ["arroz"];
    const r5 = { ingredients: [{ name: "arroz", unit: "g" }, { name: "sal", unit: "a gosto" }, { name: "azeite", unit: "opcional" }] };
    const res5 = recipeIsFullyStocked(r5);
    if (res5 !== true) throw new Error("Test 5 Failed: 'a gosto'/'opcional' should not prevent matching");

    // Test 6: Bidirectional substring matching
    global.pantryItems = ["frango", "cebola picada"];
    const r6 = { ingredients: [{ name: "peito de frango", unit: "g" }, { name: "cebola", unit: "g" }] };
    const res6 = recipeIsFullyStocked(r6);
    if (res6 !== true) throw new Error("Test 6 Failed: substring bidirecional matching should return true");

    console.log("All Despensa Logic tests passed successfully!");
} catch (err) {
    console.error("Test execution failed:", err.message);
    process.exit(1);
}
