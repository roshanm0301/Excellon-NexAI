/**
 * Bulk-convert task editor files to auto-save pattern.
 *
 * Transformations:
 * 1. Add `import { useAutoSave } from "../../hooks/useAutoSave";`
 * 2. Add `const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);`
 * 3. Remove `handleSubmit` function
 * 4. Remove `<form ...>` and `</form>` wrappers
 * 5. Remove save button item from DXForm items
 * 6. Add `onFieldDataChanged={onFieldDataChanged}` to DXForm
 * 7. Update payload callbacks to call autoSave
 * 8. Remove `notifyChildrenChanged` from useStepEditor destructuring (if only used in handleSubmit)
 *
 * Usage: node scripts/convert-auto-save.js
 */

const fs = require('fs');
const path = require('path');

const TASK_DIR = path.join(__dirname, '..', 'src', 'pages', 'actionWorkflow', 'task');
const SKIP_FILES = ['index.ts', 'index.tsx'];
// Already converted
const ALREADY_DONE = [
    path.join(TASK_DIR, 'document', 'document.post.tsx'),
];

let stats = { total: 0, converted: 0, skipped: 0, errors: [] };

function getAllTsxFiles(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(getAllTsxFiles(fullPath));
        } else if (entry.name.endsWith('.tsx') && !SKIP_FILES.includes(entry.name)) {
            results.push(fullPath);
        }
    }
    return results;
}

function convertFile(filePath) {
    stats.total++;
    const relPath = path.relative(TASK_DIR, filePath);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Skip files already converted or that don't have the save pattern
    if (content.includes('useAutoSave')) {
        stats.skipped++;
        return;
    }
    if (!content.includes('handleSubmit') && !content.includes('useSubmitBehavior')) {
        stats.skipped++;
        return;
    }
    if (!content.includes('useStepEditor')) {
        stats.skipped++;
        return;
    }

    try {
        let modified = content;

        // === 1. Add useAutoSave import ===
        // Insert after the useStepEditor import line
        modified = modified.replace(
            /(import\s*\{[^}]*\}\s*from\s*["'](?:\.\.\/)*react["'];?\s*\n)/,
            (match) => {
                return match + `import { useAutoSave } from "../../hooks/useAutoSave";\n`;
            }
        );

        // === 2. Remove notifyChildrenChanged from destructuring if present ===
        modified = modified.replace(
            /,\s*notifyChildrenChanged\s*/g,
            ' '
        );

        // === 3. Add useAutoSave hook call after formData useState ===
        // Find the formData useState block and add hook call after it
        // Pattern: const [formData, setFormData] = useState({...}); followed by some code before useEffect
        modified = modified.replace(
            /(const\s*\[formData,\s*setFormData\]\s*=\s*useState(?:<[^>]*>)?\s*\([^]*?\)\s*;)/,
            (match) => {
                return match + `\n  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);`;
            }
        );

        // === 4. Remove handleSubmit function ===
        // Match: const handleSubmit = (e: any) => { ... };
        // Need to handle nested braces
        modified = removeFunction(modified, 'handleSubmit');

        // === 5. Remove <form> wrapper ===
        modified = modified.replace(/<form\s+[^>]*onSubmit\s*=\s*\{handleSubmit\}[^>]*>/g, '');
        modified = modified.replace(/<form\s+[^>]*>/g, (match) => {
            if (match.includes('handleSubmit') || match.includes('onSubmit')) return '';
            return match;
        });
        modified = modified.replace(/\s*<\/form>\s*/g, '\n');

        // === 6. Add onFieldDataChanged to DXForm ===
        // Find <DXForm and add onFieldDataChanged prop
        if (!modified.includes('onFieldDataChanged={onFieldDataChanged}')) {
            modified = modified.replace(
                /(<DXForm\s+)/g,
                (match) => match + `onFieldDataChanged={onFieldDataChanged}\n          `
            );
            // Handle <DXForm\n pattern
            modified = modified.replace(
                /(<DXForm\n)/g,
                (match) => match + `          onFieldDataChanged={onFieldDataChanged}\n`
            );
        }

        // === 7. Remove save button item ===
        // Pattern: { itemType: "button", ... text: "Save" ... useSubmitBehavior: true ... },
        modified = removeSaveButtonItem(modified);

        // === 8. Update payload callbacks to call autoSave ===
        // Pattern: setFormData({ ..._formData }); or setFormData(_formData); at end of payload callback
        // Replace with adding autoSave call
        modified = updatePayloadCallbacks(modified);

        // Clean up: remove extra blank lines
        modified = modified.replace(/\n{3,}/g, '\n\n');

        if (modified !== content) {
            fs.writeFileSync(filePath, modified, 'utf-8');
            stats.converted++;
            console.log(`✅ ${relPath}`);
        } else {
            stats.skipped++;
            console.log(`⏭️  ${relPath} (no changes needed)`);
        }
    } catch (err) {
        stats.errors.push({ file: relPath, error: err.message });
        console.error(`❌ ${relPath}: ${err.message}`);
    }
}

function removeFunction(content, funcName) {
    // Match: const funcName = (params) => { ... };
    const patterns = [
        // Arrow function: const handleSubmit = (e: any) => { ... };
        new RegExp(`\\s*const\\s+${funcName}\\s*=\\s*\\([^)]*\\)\\s*(?::\\s*\\w+)?\\s*=>\\s*`, 'g'),
        // Regular function: function handleSubmit(e: any) { ... }
        new RegExp(`\\s*function\\s+${funcName}\\s*\\([^)]*\\)\\s*`, 'g'),
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(content);
        if (match) {
            const start = match.index;
            const braceStart = content.indexOf('{', start + match[0].length - 1);
            if (braceStart === -1) continue;

            const braceEnd = findMatchingBrace(content, braceStart);
            if (braceEnd === -1) continue;

            // Include trailing semicolon if present
            let end = braceEnd + 1;
            if (content[end] === ';') end++;

            content = content.substring(0, start) + content.substring(end);
            break;
        }
    }
    return content;
}

function findMatchingBrace(content, start) {
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let inTemplate = false;

    for (let i = start; i < content.length; i++) {
        const ch = content[i];
        const prev = i > 0 ? content[i - 1] : '';

        if (inString) {
            if (ch === stringChar && prev !== '\\') {
                inString = false;
            }
            continue;
        }

        if (inTemplate) {
            if (ch === '`' && prev !== '\\') {
                inTemplate = false;
            }
            continue;
        }

        if (ch === '"' || ch === "'") {
            inString = true;
            stringChar = ch;
            continue;
        }
        if (ch === '`') {
            inTemplate = true;
            continue;
        }

        if (ch === '{') depth++;
        if (ch === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function removeSaveButtonItem(content) {
    // Remove the save button item block from DXForm items array
    // Patterns:
    // { itemType: "button", ... text: "Save" ... },
    // { itemType: "button", ... useSubmitBehavior: true ... },

    // Find all occurrences of itemType: "button" with Save/useSubmitBehavior
    let result = content;
    const buttonRegex = /\{\s*\n?\s*itemType:\s*["']button["']/g;
    let match;
    let offset = 0;

    // Reset regex
    const matches = [];
    while ((match = buttonRegex.exec(content)) !== null) {
        // Check if this block contains "Save" or "useSubmitBehavior"
        const blockStart = match.index;
        const braceEnd = findMatchingBrace(content, blockStart);
        if (braceEnd === -1) continue;

        const block = content.substring(blockStart, braceEnd + 1);
        if (block.includes('Save') || block.includes('useSubmitBehavior')) {
            matches.push({ start: blockStart, end: braceEnd + 1 });
        }
    }

    // Remove matches in reverse order to preserve indices
    for (let i = matches.length - 1; i >= 0; i--) {
        let { start, end } = matches[i];

        // Include leading comma/whitespace
        let actualStart = start;
        while (actualStart > 0 && (result[actualStart - 1] === ' ' || result[actualStart - 1] === '\n' || result[actualStart - 1] === '\r' || result[actualStart - 1] === '\t')) {
            actualStart--;
        }

        // Include trailing comma
        let actualEnd = end;
        while (actualEnd < result.length && (result[actualEnd] === ',' || result[actualEnd] === ' ' || result[actualEnd] === '\n' || result[actualEnd] === '\r')) {
            actualEnd++;
            if (result[actualEnd - 1] === ',') break;
        }

        result = result.substring(0, actualStart) + result.substring(actualEnd);
    }

    return result;
}

function updatePayloadCallbacks(content) {
    // Find payload callback patterns and add autoSave call
    // Pattern: const onXxxCallback = (payload: any) => { ... setFormData(...); };
    // Add autoSave(_formData) or autoSave({ ...formData, xxx: payload }) after setFormData

    // Match callback functions that update formData with payload
    const callbackRegex = /const\s+(on\w*Callback)\s*=\s*\((\w+):\s*any\)\s*=>\s*\{/g;
    let result = content;
    let match;

    while ((match = callbackRegex.exec(content)) !== null) {
        const funcName = match[1];
        const paramName = match[2];
        const funcStart = match.index;
        const braceStart = content.indexOf('{', funcStart + match[0].length - 1);
        const braceEnd = findMatchingBrace(content, braceStart);
        if (braceEnd === -1) continue;

        const funcBody = content.substring(braceStart + 1, braceEnd);

        // Skip if already has autoSave
        if (funcBody.includes('autoSave')) continue;

        // Find the setFormData call and add autoSave after it
        // Common patterns:
        // 1. const _formData = { ...formData, payload }; setFormData(_formData);
        // 2. const _formData = { ...formData, payload }; setFormData({ ..._formData });
        // 3. setFormData({ ...formData, payload });

        if (funcBody.includes('_formData') && funcBody.includes('setFormData')) {
            // Pattern: has _formData variable - add autoSave(_formData) after setFormData
            const setFormDataMatch = funcBody.match(/setFormData\s*\([^)]*\)\s*;/);
            if (setFormDataMatch) {
                const insertPos = braceStart + 1 + funcBody.indexOf(setFormDataMatch[0]) + setFormDataMatch[0].length;
                result = result.substring(0, insertPos) + '\n    autoSave(_formData);' + result.substring(insertPos);
                // Update content for subsequent matches
                content = result;
            }
        } else if (funcBody.includes('setFormData')) {
            // Pattern: inline setFormData - extract the data and add autoSave
            const setFormDataMatch = funcBody.match(/setFormData\s*\(\s*(\{[^}]+\})\s*\)\s*;/);
            if (setFormDataMatch) {
                const insertPos = braceStart + 1 + funcBody.indexOf(setFormDataMatch[0]) + setFormDataMatch[0].length;
                result = result.substring(0, insertPos) + `\n    autoSave(${setFormDataMatch[1]});` + result.substring(insertPos);
                content = result;
            }
        }
    }

    return result;
}

// === Main ===
console.log('🔄 Converting task editors to auto-save pattern...\n');

const files = getAllTsxFiles(TASK_DIR).filter(f => !ALREADY_DONE.includes(f));
files.forEach(convertFile);

console.log('\n📊 Summary:');
console.log(`   Total files scanned: ${stats.total}`);
console.log(`   Converted: ${stats.converted}`);
console.log(`   Skipped: ${stats.skipped}`);
if (stats.errors.length > 0) {
    console.log(`   Errors: ${stats.errors.length}`);
    stats.errors.forEach(e => console.log(`     - ${e.file}: ${e.error}`));
}
