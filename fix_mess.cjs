const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');
code = code.replace(/\{new Date\(inst\.dueDate\)\.getTime\(\) < new Date\(\)\.setHours\(0,0,0,0\) \{new Date.*?&& \(\(/g, '{new Date(inst.dueDate).getTime() < new Date().setHours(0,0,0,0) && (');
code = code.replace(/\{new Date\(inst\.dueDate\)\.getTime\(\) < new Date\(\)\.setHours\(0,0,0,0\) \{.*/g, '{new Date(inst.dueDate).getTime() < new Date().setHours(0,0,0,0) && (');
fs.writeFileSync('pages/Cariler.tsx', code);
