const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../../client/src');
const outFile = path.resolve(__dirname, 'extracted-keys.json');

const keySet = new Set();
const tRegex = /\bt\(\s*(["'`])(.+?)\1\s*\)/g;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      let match;
      while ((match = tRegex.exec(content)) !== null) {
        const quote = match[1];
        const rawKey = match[2];
        // Skip template literals
        if (quote === '`') continue;
        // Skip keys that are just numbers or start with special chars
        if (/^\d+$/.test(rawKey)) continue;
        if (/^[^a-zA-Z]/.test(rawKey)) continue;
        keySet.add(rawKey);
      }
    }
  }
}

walk(srcDir);

const sorted = [...keySet].sort();

fs.writeFileSync(outFile, JSON.stringify(sorted, null, 2), 'utf8');

console.log(`Total unique keys: ${sorted.length}`);
console.log('First 20 keys:');
sorted.slice(0, 20).forEach((k, i) => console.log(`  ${i + 1}. ${k}`));
