import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entityId = process.argv[2] || '2feaf604-9b0c-4317-93b1-6d7608218bf6';
const storeName = process.argv[3] || 'test';

const rows = [
  {
    name: 'Bulk User One',
    email: 'bulk.user1@example.com',
    employeeId: 'BU001',
    designation: 'Store Employee',
    manager: 'John Doe',
  },
  {
    name: 'Bulk User Two',
    email: 'bulk.user2@example.com',
    employeeId: 'BU002',
    designation: 'Store Manager',
    manager: 'Bulk User One',
  },
  {
    name: 'Bulk User Three',
    email: 'bulk.user3@example.com',
    employeeId: 'BU003',
    designation: 'Area Manager',
    manager: '',
  },
];

const worksheet = XLSX.utils.json_to_sheet(rows);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

const filePath = path.join(__dirname, 'test-bulk-users.xlsx');
XLSX.writeFile(workbook, filePath);

const parsed = XLSX.utils.sheet_to_json(XLSX.readFile(filePath).Sheets['Users']);
const usersToCreate = parsed.map((row) => ({
  userId: crypto.randomUUID(),
  name: row.name || row.Name || '',
  email: row.email || row.Email || '',
  employeeId: row.employeeId || row['Employee ID'] || '',
  designation: row.designation || row.Designation || '',
  manager: row.manager || row.Manager || '',
  password: 'ChangeMe123!',
  entityId,
  storeName,
  validEmail: true,
  isActive: true,
  tags: {},
}));

console.log('Uploading', usersToCreate.length, 'users to entity', entityId);

const response = await fetch('http://localhost:3002/users/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ users: usersToCreate }),
});

const result = await response.json();
console.log('Status:', response.status);
console.log('Result:', JSON.stringify(result, null, 2));

if (!response.ok) {
  process.exit(1);
}

const listResponse = await fetch('http://localhost:3002/users?limit=100');
const list = await listResponse.json();
const uploadedEmails = usersToCreate.map((u) => u.email);
const found = list.users.filter((u) => uploadedEmails.includes(u.email));

console.log('\nVerification:');
console.log('- Expected:', uploadedEmails.length);
console.log('- Found in user list:', found.length);
found.forEach((u) => console.log(`  ✓ ${u.name} <${u.email}>`));

if (found.length !== uploadedEmails.length) {
  console.error('Some bulk users were not found in the list');
  process.exit(1);
}

console.log('\nBulk upload test passed.');
fs.unlinkSync(filePath);
