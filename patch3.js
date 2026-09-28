const fs = require('fs');

let content = fs.readFileSync('src/features/employees/components/EmployeeDetail.tsx', 'utf8');

if (!content.includes('<EmployeeFormModal')) {
    const modalInsert = `\n      {isEditorOpen && employee && (\n        <EmployeeFormModal\n          isOpen={isEditorOpen}\n          onClose={() => setIsEditorOpen(false)}\n          employee={employee}\n          onSave={async (values, photo) => {\n            await handleEditEmployee(employee.id, values, photo);\n            // Optimistically update local view\n            setEmployee({ ...employee, ...values } as any);\n            setIsEditorOpen(false);\n          }}\n          lookupData={lookupData}\n          isLookupLoading={isLookupLoading}\n        />\n      )}\n    </div>\n  );\n}`;
    content = content.replace(/    <\/div>\s*\);\s*\}/, modalInsert);
    fs.writeFileSync('src/features/employees/components/EmployeeDetail.tsx', content, 'utf8');
}
console.log('Success');
