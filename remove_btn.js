const fs = require('fs');
let content = fs.readFileSync('src/components/profile/EditProfileModal.tsx', 'utf8');

const regex = /\s*\{photoPreview && \(\s*<button\s*type="button"\s*onClick=\{\(\) => \{\s*setPhotoPreview\(null\);\s*setPhotoError\(''\);\s*\}\}\s*disabled=\{isSubmitting\}\s*className="inline-flex items-center gap-1\.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 disabled:opacity-50"\s*>\s*<Trash2 size=\{15\} \/> \{t\('action\.removePhoto'\)\}\s*<\/button>\s*\)\}/g;

content = content.replace(regex, '');
fs.writeFileSync('src/components/profile/EditProfileModal.tsx', content, 'utf8');
console.log('Success');
