const fs = require('fs');
const path = require('path');

// Extract functions from index.html using brace counting
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
    const normalizeSearchText = new Function('str', normalizeBody);

    const matchBody = extractFunction('matchRecipeSearch');
    const matchRecipeSearch = new Function('recipe', 'rawQuery', `
        const normalizeSearchText = function(str) { ${normalizeBody} };
        ${matchBody}
    `);

    console.log("Running tests...");
    
    // Test 1: normalizeSearchText
    const t1 = normalizeSearchText("Pão de Açúcar");
    if (t1 !== "pao de acucar") throw new Error(`Test 1 Failed: expected 'pao de acucar', got '${t1}'`);

    // Test 2: matchRecipeSearch with empty query
    const recipe = {
        title: "Bolo de Cenoura",
        ingredients: [{ name: "Cenoura" }, { name: "Açúcar" }]
    };
    const res2 = matchRecipeSearch(recipe, "");
    if (!res2.matches || res2.matchedIngredients.length !== 0) {
        throw new Error(`Test 2 Failed: expected matches=true, matchedIngredients=[], got matches=${res2.matches}, matchedIngredients=${JSON.stringify(res2.matchedIngredients)}`);
    }

    // Test 3: matchRecipeSearch matching title
    const res3 = matchRecipeSearch(recipe, "Bolo");
    if (!res3.matches || res3.matchedIngredients.length !== 0) {
        throw new Error(`Test 3 Failed: expected matches=true, matchedIngredients=[], got matches=${res3.matches}, matchedIngredients=${JSON.stringify(res3.matchedIngredients)}`);
    }

    // Test 4: matchRecipeSearch matching ingredient
    const res4 = matchRecipeSearch(recipe, "acucar");
    if (!res4.matches || !res4.matchedIngredients.includes("Açúcar")) {
        throw new Error(`Test 4 Failed: expected matches=true, matchedIngredients=['Açúcar'], got matches=${res4.matches}, matchedIngredients=${JSON.stringify(res4.matchedIngredients)}`);
    }

    // Test 5: matchRecipeSearch multiple terms (AND logic)
    const res5 = matchRecipeSearch(recipe, "bolo cenoura acucar");
    if (!res5.matches || !res5.matchedIngredients.includes("Açúcar")) {
        throw new Error(`Test 5 Failed: expected matches=true, matchedIngredients=['Açúcar'], got matches=${res5.matches}, matchedIngredients=${JSON.stringify(res5.matchedIngredients)}`);
    }

    // Test 6: matchRecipeSearch term not found
    const res6 = matchRecipeSearch(recipe, "frango");
    if (res6.matches) {
        throw new Error(`Test 6 Failed: expected matches=false, got matches=true`);
    }

    console.log("All tests passed successfully!");
} catch (err) {
    console.error("Test execution failed:", err.message);
    process.exit(1);
}
