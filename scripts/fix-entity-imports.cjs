/**
 * Fixes broken typeorm import lines produced by add-audit-fields-to-entities.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOTS = [
  path.join(__dirname, '..', 'server', 'user-service', 'src'),
  path.join(__dirname, '..', 'server', 'org-service', 'src'),
  path.join(__dirname, '..', 'server', 'audit-log-service', 'src'),
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (name.endsWith('.entity.ts')) files.push(full);
  }
  return files;
}

function fixImports(content) {
  const importRegex = /import\s*\{[^}]+\}\s*from\s*'typeorm';/g;
  const matches = [...content.matchAll(importRegex)];
  if (matches.length <= 1) {
    const line = content.split('\n')[0];
    if (line && line.includes('} import {')) {
      const tokens = line.match(/\{([^}]+)\}/g) || [];
      const names = new Set();
      for (const token of tokens) {
        token
          .slice(1, -1)
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
          .forEach((part) => names.add(part));
      }
      const fixed = `import { ${[...names].join(', ')} } from 'typeorm';`;
      return content.replace(line, fixed);
    }
    return content;
  }

  const names = new Set();
  for (const match of matches) {
    const inner = match[0].match(/\{([^}]+)\}/);
    if (!inner) continue;
    inner[1]
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => names.add(part));
  }

  let next = content;
  for (const match of matches) {
    next = next.replace(match[0], '');
  }

  const fixedImport = `import { ${[...names].join(', ')} } from 'typeorm';`;
  return `${fixedImport}\n${next.replace(/^\s*\n/, '')}`;
}

const files = ROOTS.flatMap((root) => walk(root));
let fixedCount = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const firstLine = original.split('\n')[0];
  if (
    !firstLine.includes('} import {') &&
    !firstLine.match(/import\s*\{[^}]+\}\s*from\s*'typeorm';.*import/)
  ) {
    continue;
  }
  const updated = fixImports(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated, 'utf8');
    fixedCount += 1;
    console.log('fixed', path.relative(process.cwd(), file));
  }
}

console.log(`Fixed ${fixedCount} files`);
