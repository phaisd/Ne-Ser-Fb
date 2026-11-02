const fs = require('fs');
const path = require('path');

const jsonPath = path.join(process.cwd(), 'data', 'instructors.json');
const csvPath = path.join(process.cwd(), 'data', 'instructors.csv');

const users = JSON.parse(fs.readFileSync(jsonPath, 'utf8') || '[]');
const escapeCsv = (str) => '"' + String(str || '').replace(/"/g, '""') + '"';

const headers = ['id', 'name', 'email', 'gmail', 'department', 'role', 'isActive', 'isSuspended', 'createdAt'];
const lines = [headers.join(',')];

for (const u of users) {
  const line = [
    escapeCsv(u.id),
    escapeCsv(u.name),
    escapeCsv(u.email),
    escapeCsv(u.gmail),
    escapeCsv(u.department),
    escapeCsv(u.role || 'INSTRUCTOR'),
    escapeCsv(u.isActive !== false ? 'TRUE' : 'FALSE'),
    escapeCsv(u.isSuspended ? 'TRUE' : 'FALSE'),
    escapeCsv(u.createdAt || '')
  ];
  lines.push(line.join(','));
}

fs.writeFileSync(csvPath, '\uFEFF' + lines.join('\n'), 'utf8');
console.log('Successfully generated data/instructors.csv with', users.length, 'instructors.');
