const fs = require('fs');
const path = require('path');

const SERVICES = [
  { dir: 'user-service', connection: 'user' },
  { dir: 'org-service', connection: 'org' },
  { dir: 'audit-log-service', connection: 'default' },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

function patchInjectRepository(content, connection) {
  return content.replace(
    /@InjectRepository\(([^,\)]+)\)/g,
    `@InjectRepository($1, '${connection}')`,
  );
}

for (const service of SERVICES) {
  const srcDir = path.join(__dirname, '..', service.dir, 'src');
  if (!fs.existsSync(srcDir)) continue;

  for (const file of walk(srcDir)) {
    if (!file.endsWith('.service.ts')) continue;
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    content = patchInjectRepository(content, service.connection);
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${path.relative(process.cwd(), file)}`);
    }
  }
}

console.log('InjectRepository connection names applied.');
