'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Language = 'en' | 'ur';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/* ═══════════════════════════════════════════════════════════
   Translations — English + Urdu
   ═══════════════════════════════════════════════════════════ */
const translations: Record<Language, Record<string, string>> = {
  en: {
    // ── Navigation ──
    'nav.dashboard': 'Dashboard',
    'nav.employees': 'Employees',
    'nav.recruitment': 'Recruitment',
    'nav.attendance': 'Attendance',
    'nav.leave': 'Leave',
    'nav.remote': 'Remote',
    'nav.payroll': 'Payroll',
    'nav.progress': 'Progress',
    'nav.expenses': 'Expenses',
    'nav.documents': 'Documents',
    'nav.myLeave': 'My Leave',
    'nav.myProgress': 'My Progress',
    'nav.myExpenses': 'My Expenses',
    'nav.myDocuments': 'My Documents',
    'nav.employeeProgress': 'Employee Progress',
    'nav.leaveManagement': 'Leave Management',
    'nav.reports': 'Reports',
    'nav.configuration': 'Configuration',
    'nav.settings': 'Settings',
    'nav.departments': 'Departments',
    'nav.branches': 'Branches',
    'nav.shifts': 'Shifts',
    'nav.leavePolicies': 'Leave Policies',

    // ── Roles ──
    'role.super_admin': 'Super Admin',
    'role.hr_manager': 'HR Manager',
    'role.employee': 'Employee',

    // ── Common Actions ──
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.add': 'Add',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.export': 'Export',
    'action.import': 'Import',
    'action.submit': 'Submit',
    'action.back': 'Back',
    'action.next': 'Next',
    'action.close': 'Close',
    'action.confirm': 'Confirm',
    'action.apply': 'Apply',
    'action.clear': 'Clear',
    'action.logout': 'Sign Out',
    'action.login': 'Sign In',
    'action.backToDashboard': 'Back to Dashboard',
    'action.editProfile': 'Edit Profile',
    'action.choosePhoto': 'Choose Photo',
    'action.replacePhoto': 'Replace Photo',
    'action.removePhoto': 'Remove',
    'action.saving': 'Saving…',
    'action.markAllRead': 'Mark all read',
    'action.viewAll': 'View All',

    // ── Settings ──
    'settings.title': 'Settings',
    'settings.preferences': 'App Preferences',
    'settings.preferencesDesc': 'Customize your experience by changing the theme or language settings.',
    'settings.appearance': 'Appearance',
    'settings.appearanceDesc': 'Select your preferred color theme',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.language': 'Language',
    'settings.languageDesc': 'Choose your interface language',
    'settings.systemLanguage': 'System Language',
    'settings.changePassword': 'Change Password',
    'settings.currentPassword': 'Current Password',
    'settings.newPassword': 'New Password',
    'settings.confirmPassword': 'Confirm New Password',
    'settings.updatePassword': 'Update Password',

    // ── Configuration ──
    'config.departments': 'Departments Configuration',
    'config.branches': 'Branches Configuration',
    'config.shifts': 'Shifts Configuration',
    'config.leavePolicies': 'Leave Policies Configuration',
    'config.addDepartment': 'Add Department',
    'config.addBranch': 'Add Branch',
    'config.addShift': 'Add Shift',
    'config.addLeaveType': 'Add Leave Type',
    'config.departmentName': 'Department Name',
    'config.branchName': 'Branch Name',
    'config.shiftName': 'Shift Name',
    'config.leaveTypeName': 'Leave Type Name',
    'config.head': 'Head (optional)',
    'config.city': 'City (optional)',
    'config.address': 'Address (optional)',
    'config.startTime': 'Start Time',
    'config.endTime': 'End Time',
    'config.daysAllowed': 'Days Allowed',
    'config.period': 'Period',
    'config.perMonth': 'Per Month (resets monthly)',
    'config.perYear': 'Per Year',
    'config.carryForward': 'Carry forward unused days',
    'config.description': 'Description (optional)',

    // ── Profile ──
    'profile.title': 'My Profile',
    'profile.accountInfo': 'Account Information',
    'profile.fullName': 'Full Name',
    'profile.email': 'Email',
    'profile.role': 'Role',
    'profile.personalInfo': 'Personal Information',
    'profile.employmentInfo': 'Employment',
    'profile.department': 'Department',
    'profile.designation': 'Designation',
    'profile.branch': 'Branch',
    'profile.shift': 'Shift',
    'profile.joinDate': 'Join Date',
    'profile.status': 'Status',
    'profile.phone': 'Phone',
    'profile.salary': 'Salary',

    // ── Dashboard ──
    'dashboard.welcome': 'Welcome back',
    'dashboard.totalEmployees': 'Total Employees',
    'dashboard.presentToday': 'Present Today',
    'dashboard.onLeave': 'On Leave',
    'dashboard.pendingRequests': 'Pending Requests',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.todaySummary': "Today's Summary",

    // ── Employees ──
    'employees.title': 'Employees',
    'employees.addNew': 'Add New Employee',
    'employees.searchPlaceholder': 'Search employees...',
    'employees.firstName': 'First Name',
    'employees.lastName': 'Last Name',
    'employees.name': 'Name',
    'employees.email': 'Email',
    'employees.department': 'Department',
    'employees.designation': 'Designation',
    'employees.status': 'Status',
    'employees.actions': 'Actions',

    // ── Leave ──
    'leave.title': 'Leave Management',
    'leave.requestLeave': 'Request Leave',
    'leave.leaveType': 'Leave Type',
    'leave.startDate': 'Start Date',
    'leave.endDate': 'End Date',
    'leave.reason': 'Reason',
    'leave.status': 'Status',
    'leave.balance': 'Leave Balance',
    'leave.history': 'Leave History',

    // ── Attendance ──
    'attendance.title': 'Attendance',
    'attendance.checkIn': 'Check In',
    'attendance.checkOut': 'Check Out',
    'attendance.date': 'Date',
    'attendance.time': 'Time',
    'attendance.status': 'Status',

    // ── Payroll ──
    'payroll.title': 'Payroll',
    'payroll.basicSalary': 'Basic Salary',
    'payroll.deductions': 'Deductions',
    'payroll.netSalary': 'Net Salary',
    'payroll.paySlip': 'Pay Slip',

    // ── Expenses ──
    'expenses.title': 'Expenses',
    'expenses.addExpense': 'Add Expense',
    'expenses.category': 'Category',
    'expenses.amount': 'Amount',
    'expenses.date': 'Date',
    'expenses.receipt': 'Receipt',

    // ── Documents ──
    'documents.title': 'Documents',
    'documents.upload': 'Upload Document',

    // ── Reports ──
    'reports.title': 'Reports',
    'reports.generate': 'Generate Report',

    // ── Recruitment ──
    'recruitment.title': 'Recruitment',
    'recruitment.addJob': 'Add Job',
    'recruitment.freePositions': 'Free Positions',
    'recruitment.candidatesNoted': 'Candidates Noted',
    'recruitment.remindersLeft': 'Reminders Left',
    'recruitment.hired': 'Hired',
    'recruitment.tab.summary': 'Summary',
    'recruitment.tab.offers': 'Offers Noted',
    'recruitment.tab.reminders': 'Reminders',
    'recruitment.tab.status': 'Status',
    'recruitment.tab.candidates': 'Candidates Diary',
    'recruitment.tab.jobs': 'Free Positions',

    // ── Remote ──
    'remote.title': 'Remote Work',
    'remote.request': 'Request Remote',

    // ── Notifications ──
    'notifications.title': 'Notifications',
    'notifications.noNew': 'No new notifications',
    'notifications.empty': 'All caught up!',

    // ── Misc ──
    'misc.loading': 'Loading...',
    'misc.noData': 'No data available',
    'misc.showing': 'Showing',
    'misc.of': 'of',
    'misc.results': 'results',
    'misc.previous': 'Previous',
    'misc.next': 'Next',
    'misc.page': 'Page',
  },

  ur: {
    // 🌍 Navigation 🌍
    'nav.dashboard': 'ڈیش بورڈ',
    'nav.employees': 'ملازمین',
    'nav.recruitment': 'بھرتی',
    'nav.attendance': 'حاضری',
    'nav.leave': 'چھٹی',
    'nav.remote': 'ریموٹ',
    'nav.payroll': 'تنخواہ',
    'nav.progress': 'پیش رفت',
    'nav.expenses': 'اخراجات',
    'nav.documents': 'دستاویزات',
    'nav.myLeave': 'میری چھٹی',
    'nav.myProgress': 'میری پیش رفت',
    'nav.myExpenses': 'میرے اخراجات',
    'nav.myDocuments': 'میری دستاویزات',
    'nav.employeeProgress': 'ملازم کی پیش رفت',
    'nav.leaveManagement': 'چھٹی کا انتظام',
    'nav.reports': 'رپورٹس',
    'nav.configuration': 'ترتیبات',
    'nav.settings': 'سیٹنگز',
    'nav.departments': 'محکمے',
    'nav.branches': 'برانچز',
    'nav.shifts': 'شفٹس',
    'nav.leavePolicies': 'چھٹی کی پالیسیاں',

    // 👤 Roles 👤
    'role.super_admin': 'سپر ایڈمن',
    'role.hr_manager': 'ایچ آر منیجر',
    'role.employee': 'ملازم',

    // ⚡ Common Actions ⚡
    'action.save': 'محفوظ کریں',
    'action.cancel': 'منسوخ کریں',
    'action.delete': 'حذف کریں',
    'action.edit': 'ترمیم',
    'action.add': 'شامل کریں',
    'action.search': 'تلاش کریں',
    'action.filter': 'فلٹر',
    'action.export': 'ایکسپورٹ',
    'action.import': 'امپورٹ',
    'action.submit': 'جمع کریں',
    'action.back': 'واپس',
    'action.next': 'اگلا',
    'action.close': 'بند کریں',
    'action.confirm': 'تصدیق کریں',
    'action.apply': 'لاگو کریں',
    'action.clear': 'صاف کریں',
    'action.logout': 'لاگ آؤٹ',
    'action.login': 'لاگ ان',
    'action.backToDashboard': 'ڈیش بورڈ پر واپس',

    // 📊 Dashboard 📊
    'dashboard.welcome': 'خوش آمدید',
    'dashboard.today': 'آج',

    // 👨‍💼 Profile & Settings 👨‍💼
    'profile.edit': 'پروفائل میں ترمیم کریں',
    'profile.upload': 'تصویر اپلوڈ کریں',
    'profile.name': 'پورا نام',
    'profile.email': 'ای میل ایڈریس',
    'profile.phone': 'فون نمبر',
    'profile.address': 'موجودہ پتہ',
    'profile.password': 'پاس ورڈ تبدیل کریں',
    'profile.currentPassword': 'موجودہ پاس ورڈ',
    'profile.newPassword': 'نیا پاس ورڈ',
    'profile.confirmPassword': 'پاس ورڈ کی تصدیق کریں',
    
    // 📑 Settings Page 📑
    'settings.title': 'اکاؤنٹ کی ترتیبات',
    'settings.preferences': 'ترجیحات',
    'settings.language': 'زبان',
    'settings.language.desc': 'ایپلی کیشن کی زبان منتخب کریں',
    'settings.theme': 'تھیم',
    'settings.theme.desc': 'ایپلی کیشن کی شکل منتخب کریں',
    'settings.security': 'سیکیورٹی',
    'settings.password.desc': 'اپنا پاس ورڈ محفوظ رکھیں',

    // 🤝 Recruitment 🤝
    'recruitment.tab.summary': 'خلاصہ',
    'recruitment.tab.offersNoted': 'پیشکشیں',
    'recruitment.tab.reminders': 'یاد دہانیاں',
    'recruitment.tab.status': 'حیثیت',
    'recruitment.tab.candidatesDiary': 'امیدواروں کی ڈائری',
    'recruitment.tab.freePositions': 'خالی آسامیاں',
    
    'recruitment.freePositions': 'خالی آسامیاں',
    'recruitment.candidatesNoted': 'امیدوار شامل کیے گئے',
    'recruitment.remindersLeft': 'باقی یاد دہانیاں',
    'recruitment.hired': 'رکھے گئے',

    'recruitment.btn.noteCandidate': 'امیدوار شامل کریں',
    'recruitment.btn.noteFreePosition': 'نوکری شامل کریں',
    'recruitment.empty.title': 'کوئی امیدوار نہیں',
    'recruitment.empty.desc': 'ابھی تک کوئی امیدوار شامل نہیں کیا گیا ہے۔'
  },
};

/* ═══════════════════════════════════════════════════════════
   Provider
   ═══════════════════════════════════════════════════════════ */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('app-language') as Language | null;
    if (saved === 'en' || saved === 'ur') {
      setLanguageState(saved);
    }
  }, []);

  // Apply dir and lang to <html> whenever language changes
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    html.setAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
    html.setAttribute('lang', language === 'ur' ? 'ur' : 'en');
  }, [language, mounted]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  }, [language]);

  const isRTL = language === 'ur';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}

export default LanguageContext;


