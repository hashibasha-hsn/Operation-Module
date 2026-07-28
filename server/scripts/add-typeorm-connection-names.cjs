const fs = require('fs');
const path = require('path');

// Historical one-off codemod — keep service list aligned with the four-backend layout.
const SERVICES = [
  { dir: 'user-service', connection: 'user' },
  { dir: 'org-service', connection: 'org' },
  { dir: 'audit-log-service', connection: 'default' },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.module.ts')) files.push(full);
  }
  return files;
}

function patchTypeOrmConnection(content, connection) {
  return content
    .replace(
      /TypeOrmModule\.forFeature\(\[([^\]]+)\]\)/g,
      `TypeOrmModule.forFeature([$1], '${connection}')`,
    )
    .replace(
      /TypeOrmModule\.forFeature\(\[([^\]]+)\],\s*'[^']+'\)/g,
      `TypeOrmModule.forFeature([$1], '${connection}')`,
    );
}

for (const service of SERVICES) {
  const srcDir = path.join(__dirname, '..', service.dir, 'src');
  if (!fs.existsSync(srcDir)) continue;

  for (const file of walk(srcDir)) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    content = patchTypeOrmConnection(content, service.connection);
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${path.relative(process.cwd(), file)}`);
    }
  }
}

console.log('TypeORM connection names applied.');
