const fs = require('fs');

let content = fs.readFileSync('src/features/employees/components/EmployeeDetail.tsx', 'utf8');

// Add imports
if (!content.includes('import EmployeeFormModal')) {
    content = content.replace("import type { DocumentRecord } from '@/lib/actions/documents';", 
        "import type { DocumentRecord } from '@/lib/actions/documents';\nimport EmployeeFormModal from './EmployeeFormModal';\nimport { useEmployeesSupabase } from '../hooks/useEmployeesSupabase';");
}

// Add state hooks
if (!content.includes('const [isEditorOpen, setIsEditorOpen]')) {
    content = content.replace("const [activeTab, setActiveTab] = useState('personal');",
        "const [activeTab, setActiveTab] = useState('personal');\n  const [isEditorOpen, setIsEditorOpen] = useState(false);\n  const { handleEditEmployee, lookupData, isLookupLoading } = useEmployeesSupabase();");
}

// Fix edit button
const editBtnRegex = /<Link href="\/employees">\s*<Button variant="outline" size="sm">\s*<Edit size=\{14\} \/> Edit\s*<\/Button>\s*<\/Link>/;
const editBtnNew = `<Button variant="outline" size="sm" onClick={() => setIsEditorOpen(true)}>\n                <Edit size={14} /> Edit\n              </Button>`;
content = content.replace(editBtnRegex, editBtnNew);

// Add modal at the end
const modalInsert = `\n      {isEditorOpen && employee && (\n        <EmployeeFormModal\n          isOpen={isEditorOpen}\n          onClose={() => setIsEditorOpen(false)}\n          employee={employee}\n          onSave={async (values, photo) => {\n            await handleEditEmployee(employee.id, values, photo);\n            // Optimistically update local view\n            setEmployee({ ...employee, ...values } as any);\n            setIsEditorOpen(false);\n          }}\n          lookupData={lookupData}\n          isLookupLoading={isLookupLoading}\n        />\n      )}\n    </div>\n  );\n}`;

// Find the last occurrence of "</div>\n  );\n}"
const lastIndex = content.lastIndexOf("    </div>\r\n  );\r\n}");
if (lastIndex !== -1) {
    content = content.substring(0, lastIndex) + modalInsert;
} else {
    const lastIndexLF = content.lastIndexOf("    </div>\n  );\n}");
    if (lastIndexLF !== -1) {
       content = content.substring(0, lastIndexLF) + modalInsert;
    }
}

fs.writeFileSync('src/features/employees/components/EmployeeDetail.tsx', content, 'utf8');
console.log('Success');
