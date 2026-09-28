const fs = require('fs');

let content = fs.readFileSync('src/features/employees/components/EmployeeDetail.tsx', 'utf8');

if (!content.includes('import EmployeeFormModal')) {
    content = content.replace("import type { DocumentRecord } from '@/lib/actions/documents';", 
        "import type { DocumentRecord } from '@/lib/actions/documents';\nimport EmployeeFormModal from './EmployeeFormModal';\nimport { useEmployeesSupabase } from '../hooks/useEmployeesSupabase';");
}

if (!content.includes('const [isEditorOpen, setIsEditorOpen]')) {
    content = content.replace("const [activeTab, setActiveTab] = useState('personal');",
        "const [activeTab, setActiveTab] = useState('personal');\n  const [isEditorOpen, setIsEditorOpen] = useState(false);\n  const { handleEditEmployee, lookupData, isLookupLoading } = useEmployeesSupabase();");
}

const editBtnOld = `<Link href="/employees">\n              <Button variant="outline" size="sm">\n                <Edit size={14} /> Edit\n              </Button>\n            </Link>`;
const editBtnNew = `<Button variant="outline" size="sm" onClick={() => setIsEditorOpen(true)}>\n                <Edit size={14} /> Edit\n              </Button>`;
content = content.replace(editBtnOld, editBtnNew);

if (!content.includes('<EmployeeFormModal')) {
    const renderEnd = `        </Card>\n      </div>\n    </div>\n  );\n}`;
    const modalInsert = `        </Card>\n      </div>\n\n      {isEditorOpen && employee && (\n        <EmployeeFormModal\n          isOpen={isEditorOpen}\n          onClose={() => setIsEditorOpen(false)}\n          employee={employee}\n          onSave={async (values, photo) => {\n            await handleEditEmployee(employee.id, values, photo);\n            // Optimistically update local view\n            setEmployee({ ...employee, ...values } as any);\n            setIsEditorOpen(false);\n          }}\n          lookupData={lookupData}\n          isLookupLoading={isLookupLoading}\n        />\n      )}\n    </div>\n  );\n}`;
    content = content.replace(renderEnd, modalInsert);
}

fs.writeFileSync('src/features/employees/components/EmployeeDetail.tsx', content, 'utf8');
console.log('Success');
