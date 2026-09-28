const fs = require('fs');
let content = fs.readFileSync('src/features/employees/components/EmployeeDetail.tsx', 'utf8');

// Replace local state with hook state
content = content.replace(
  "  const [isEditorOpen, setIsEditorOpen] = useState(false);\n  const { handleEditEmployee, lookupData, isLookupLoading } = useEmployeesSupabase();",
  "  const { editingEmployee, openEditor, closeEditor, handleEditEmployee, lookupData, isLookupLoading, error: submitError } = useEmployeesSupabase();"
);

// Replace button onClick
content = content.replace(
  "onClick={() => setIsEditorOpen(true)}",
  "onClick={() => openEditor(employee)}"
);

// Replace modal rendering block
const oldModal = "      {isEditorOpen && employee && (\n        <EmployeeFormModal\n          isOpen={isEditorOpen}\n          onClose={() => setIsEditorOpen(false)}\n          employee={employee}\n          onSave={async (values, photo) => {\n            await handleEditEmployee(employee.id, values, photo);\n            // Optimistically update local view\n            setEmployee({ ...employee, ...values } as any);\n            setIsEditorOpen(false);\n          }}\n          lookupData={lookupData}\n          isLookupLoading={isLookupLoading}\n        />\n      )}";
const newModal = "      {editingEmployee && (\n        <EmployeeFormModal\n          isOpen\n          onClose={closeEditor}\n          employee={editingEmployee}\n          onSave={async (values, photo) => {\n            await handleEditEmployee(values, photo);\n            // Optimistically update local view\n            setEmployee({ ...employee, ...values } as any);\n            closeEditor();\n          }}\n          lookupData={lookupData}\n          isLookupLoading={isLookupLoading}\n          submitError={submitError}\n        />\n      )}";

content = content.replace(oldModal, newModal);
fs.writeFileSync('src/features/employees/components/EmployeeDetail.tsx', content, 'utf8');
console.log('Success');
