const fs = require('fs');
let content = fs.readFileSync('src/lib/constants.ts', 'utf8');

const recruitStr = "  { name: 'Recruitment', href: '/recruitment', icon: 'UserPlus', roles: ['super_admin', 'hr_manager'] },\n";
const recruitStrRN = "  { name: 'Recruitment', href: '/recruitment', icon: 'UserPlus', roles: ['super_admin', 'hr_manager'] },\r\n";

content = content.replace(recruitStr, '').replace(recruitStrRN, '');

const expensesStr = "  { name: 'Expenses', href: '/expenses', icon: 'Receipt', roles: ['super_admin', 'hr_manager', 'employee'] },";
content = content.replace(expensesStr, expensesStr + "\n  { name: 'Recruitment', href: '/recruitment', icon: 'UserPlus', roles: ['super_admin', 'hr_manager'] },");

fs.writeFileSync('src/lib/constants.ts', content, 'utf8');
console.log('Success');
