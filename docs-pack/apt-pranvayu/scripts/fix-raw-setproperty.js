/**
 * Fix remaining raw setProperty("taskSettings") calls → autoSave() 
 */
const fs = require('fs');
const path = require('path');
const taskDir = path.join(__dirname, '..', 'src', 'pages', 'actionWorkflow', 'task');

function walk(dir) {
    let files = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) files = files.concat(walk(p));
        else if (e.name.endsWith('.tsx')) files.push(p);
    }
    return files;
}

let fixed = 0;
for (const f of walk(taskDir)) {
    let c = fs.readFileSync(f, 'utf-8');
    if (!c.includes('autoSave')) continue; // skip files without autoSave
    const orig = c;

    // Replace: setProperty("taskSettings", _formData) → autoSave(_formData)
    c = c.replace(
        /^(\s*)setProperty\(["']taskSettings["'],\s*_formData\);/gm,
        '$1autoSave(_formData);'
    );
    // Replace: setProperty("taskSettings", {...formData}) → autoSave({...formData})
    c = c.replace(
        /^(\s*)setProperty\(["']taskSettings["'],\s*\{\.\.\.formData\}\);/gm,
        '$1autoSave({...formData});'
    );
    // Replace: setProperty("taskSettings", formData) → autoSave(formData)
    c = c.replace(
        /^(\s*)setProperty\(["']taskSettings["'],\s*formData\);/gm,
        '$1autoSave(formData);'
    );
    // Replace: setProperty("taskSettings", { ...formData }) → autoSave({ ...formData })
    c = c.replace(
        /^(\s*)setProperty\(["']taskSettings["'],\s*\{\s*\.\.\.formData\s*\}\);/gm,
        '$1autoSave({ ...formData });'
    );

    if (c !== orig) {
        fs.writeFileSync(f, c, 'utf-8');
        fixed++;
        console.log('Fixed: ' + path.relative(taskDir, f));
    }
}
console.log('\nTotal fixed: ' + fixed);
