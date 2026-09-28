const fs = require('fs');

let content = fs.readFileSync('src/features/employees/components/EmployeeFormModal.tsx', 'utf8');

const oldEmploymentType = `            <Select
              name="employmentType"
              label="Employment Type"
              defaultValue={getDefaultValue('employmentType')}
              options={[{ value: '', label: 'Select Type' }, { value: 'Full-time', label: 'Full-time' }, { value: 'Part-time', label: 'Part-time' }, { value: 'Contract', label: 'Contract' }, { value: 'Intern', label: 'Intern' }]}
              required
              disabled={disabled}
            />`;

const newEmploymentTypeAndStatus = oldEmploymentType + `\n            <Select
              name="status"
              label="Status"
              defaultValue={getDefaultValue('status') || 'Active'}
              options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }, { value: 'Probation', label: 'Probation' }, { value: 'On Notice', label: 'On Notice' }]}
              required
              disabled={disabled}
            />`;

if (content.includes(oldEmploymentType) && !content.includes('name="status"')) {
    content = content.replace(oldEmploymentType, newEmploymentTypeAndStatus);
    fs.writeFileSync('src/features/employees/components/EmployeeFormModal.tsx', content, 'utf8');
    console.log('Success');
} else {
    console.log('Could not find employmentType select or status already exists');
}
