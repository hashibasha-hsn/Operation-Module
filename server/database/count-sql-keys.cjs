const fs = require('fs');
const sql = fs.readFileSync('server/database/comprehensive-translations.sql', 'utf8');
const re = /\([']([^']+)[']/g;
const keys = new Set();
let m;
while ((m = re.exec(sql))) keys.add(m[1]);
console.log('Keys in comprehensive-translations.sql:', keys.size);
const sorted = [...keys].sort();
for (let i = 0; i < Math.min(30, sorted.length); i++) console.log('  ' + sorted[i]);
