/**
 * Adds createdBy, updatedBy, createdAt, updatedAt to entity files that are missing them.
 * Run: node scripts/add-audit-fields-to-entities.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOTS = [
  path.join(__dirname, '..', 'server', 'user-service', 'src'),
  path.join(__dirname, '..', 'server', 'org-service', 'src'),
  path.join(__dirname, '..', 'server', 'audit-log-service', 'src'),
];

const SKIP_FILES = new Set([
  'audit-log.entity.ts',
  'permission-audit-log.entity.ts',
]);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (name.endsWith('.entity.ts')) {
      files.push(full);
    }
  }
  return files;
}

function ensureImport(content, token) {
  if (content.includes(token)) return content;
  const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*'typeorm';/);
  if (!importMatch) {
    return `import { ${token} } from 'typeorm';\n${content}`;
  }
  const parts = importMatch[1]
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.includes(token)) parts.push(token);
  const replacement = `import { ${parts.join(', ')} } from 'typeorm';`;
  return content.replace(importMatch[0], replacement);
}

function patchEntity(filePath) {
  const fileName = path.basename(filePath);
  if (SKIP_FILES.has(fileName)) return { filePath, changed: false, reason: 'skipped-audit-log' };

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  const hasCreatedBy = /\bcreatedBy\b/.test(content);
  const hasUpdatedBy = /\bupdatedBy\b/.test(content);
  const hasCreatedAt = /@CreateDateColumn/.test(content);
  const hasUpdatedAt = /@UpdateDateColumn/.test(content);

  if (hasCreatedBy && hasUpdatedBy && hasCreatedAt && hasUpdatedAt) {
    return { filePath, changed: false, reason: 'already-complete' };
  }

  const insertLines = [];
  if (!hasCreatedBy) {
    insertLines.push('  @Column({ length: 255, nullable: true })');
    insertLines.push('  createdBy: string;');
    insertLines.push('');
  }
  if (!hasUpdatedBy) {
    insertLines.push('  @Column({ length: 255, nullable: true })');
    insertLines.push('  updatedBy: string;');
    insertLines.push('');
  }
  if (!hasCreatedAt) {
    content = ensureImport(content, 'CreateDateColumn');
    insertLines.push('  @CreateDateColumn()');
    insertLines.push('  createdAt: Date;');
    insertLines.push('');
  }
  if (!hasUpdatedAt) {
    content = ensureImport(content, 'UpdateDateColumn');
    insertLines.push('  @UpdateDateColumn()');
    insertLines.push('  updatedAt: Date;');
  }

  if (insertLines.length === 0) {
    return { filePath, changed: false, reason: 'nothing-to-add' };
  }

  const block = `\n${insertLines.join('\n')}\n`;
  const lastBrace = content.lastIndexOf('}');
  if (lastBrace === -1) {
    return { filePath, changed: false, reason: 'no-class-end' };
  }

  content = content.slice(0, lastBrace) + block + content.slice(lastBrace);

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { filePath, changed: true };
  }

  return { filePath, changed: false, reason: 'unchanged' };
}

const files = ROOTS.flatMap((root) => walk(root));
const results = files.map(patchEntity);
const changed = results.filter((r) => r.changed);
const skipped = results.filter((r) => !r.changed);

console.log(`Patched ${changed.length} / ${files.length} entity files`);
for (const item of changed) {
  console.log('  +', path.relative(process.cwd(), item.filePath));
}
console.log(`Skipped/unchanged: ${skipped.length}`);
