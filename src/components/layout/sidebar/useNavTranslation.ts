import { useLanguage } from '../../../contexts/LanguageContext';

/** Maps English nav item names to i18n keys */
const navKeyMap: Record<string, string> = {
  Dashboard: 'nav.dashboard',
  Employees: 'nav.employees',
  Recruitment: 'nav.recruitment',
  Attendance: 'nav.attendance',
  Leave: 'nav.leave',
  Remote: 'nav.remote',
  Payroll: 'nav.payroll',
  Progress: 'nav.progress',
  Expenses: 'nav.expenses',
  Documents: 'nav.documents',
  Reports: 'nav.reports',
  Configuration: 'nav.configuration',
  Settings: 'nav.settings',
  Departments: 'nav.departments',
  Branches: 'nav.branches',
  Shifts: 'nav.shifts',
  'Leave Policies': 'nav.leavePolicies',
};

export function useNavTranslation() {
  const { t } = useLanguage();
  return (name: string) => {
    const key = navKeyMap[name];
    return key ? t(key) : name;
  };
}
