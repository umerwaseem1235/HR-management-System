const fs = require('fs');

let content = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf8');

const urDict = `  ur: {
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
    'recruitment.empty.desc': 'ابھی تک کوئی امیدوار شامل نہیں کیا گیا ہے۔'`;

const startIdx = content.indexOf('  ur: {');
if (startIdx !== -1) {
    const searchString = "'recruitment.empty.desc': '???? ?? ???? ??????? ???? ???? ??? ??? ???'";
    let replaceEndIdx = content.indexOf(searchString, startIdx);
    
    if (replaceEndIdx > startIdx) {
       replaceEndIdx += searchString.length;
       content = content.substring(0, startIdx) + urDict + content.substring(replaceEndIdx);
       fs.writeFileSync('src/contexts/LanguageContext.tsx', content, 'utf8');
       console.log('Success');
    } else {
       console.log('End bound not found');
    }
} else {
    console.log('ur: { not found');
}
