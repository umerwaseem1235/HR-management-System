const fs = require('fs');
let content = fs.readFileSync('src/features/employees/components/EmployeeFormModal.tsx', 'utf8');

const regex = /<Input name="joiningDate"/;
const statusSelect = `<Select\n              name="status"\n              label="Status"\n              defaultValue={getDefaultValue('status') || 'Active'}\n              options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }, { value: 'Probation', label: 'Probation' }, { value: 'On Notice', label: 'On Notice' }]}\n              required\n              disabled={disabled}\n            />\n            `;

if (!content.includes('name="status"')) {
    content = content.replace(regex, statusSelect + '<Input name="joiningDate"');
    fs.writeFileSync('src/features/employees/components/EmployeeFormModal.tsx', content, 'utf8');
    console.log('Success');
}
