const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules') continue;
    if (entry.isDirectory()) results.push(...walkDir(full));
    else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) results.push(full);
  }
  return results;
}

const extracted = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted-keys.json'), 'utf8')));
const allKeys = new Set();
const reLabel = /labelKey:\s*['"]([^'"]+)['"]/g;
const files = walkDir(path.join(__dirname, '..', '..', 'client', 'src'));

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = reLabel.exec(content))) allKeys.add(m[1]);
}

console.log('Total labelKeys:', allKeys.size);
const missing = [...allKeys].filter(k => !extracted.has(k)).sort();
console.log('Missing from extracted-keys.json:', missing.length);
for (const k of missing) console.log('  MISSING:', k);
