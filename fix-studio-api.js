const fs = require('fs');
const path = require('path');

console.log('Editing studioApi.ts...\n');

const apiPath = 'src/react/src/config/studioApi.ts';
let content = fs.readFileSync(apiPath, 'utf8');
const lines = content.split('\n');

// Find section markers
let removePluginLine = -1;
let workflowV2Line = -1;
let monitoringLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export const removePlugin')) removePluginLine = i;
  if (lines[i].includes('// ── Workflow Engine V2 API')) workflowV2Line = i;
  if (lines[i].includes('// ── Monitoring & Coverage API')) monitoringLine = i;
}

console.log(`Found removePlugin at line ${removePluginLine}`);
console.log(`Found Workflow V2 comment at line ${workflowV2Line}`);
console.log(`Found Monitoring comment at line ${monitoringLine}\n`);

if (removePluginLine === -1 || workflowV2Line === -1 || monitoringLine === -1) {
  console.error('Could not find all section markers!');
  process.exit(1);
}

// Keep only: start to removePlugin + 1 line
const cleanedLines = lines.slice(0, removePluginLine + 2);

// Write the cleaned file
fs.writeFileSync(apiPath, cleanedLines.join('\n'), 'utf8');

console.log(`✓ Removed all rule/workflow/monitoring sections`);
console.log(`✓ File now has ${cleanedLines.length} lines (was ${lines.length})\n`);
console.log('Done!');
