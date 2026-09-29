const fs = require('fs');
const code = fs.readFileSync('test_inner.tsx', 'utf8');
const before = code.substring(0, 2499);
const linesBefore = before.split('\n');
console.log('Error around line:', linesBefore.length);
console.log(linesBefore.slice(Math.max(0, linesBefore.length - 5)).join('\n'));
