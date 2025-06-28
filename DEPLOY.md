# 🚀 تعليمات النشر السريع على GitHub Pages

## الخطوات السريعة:

### 1. إنشاء مستودع GitHub
```bash
# اذهب إلى https://github.com
# اضغط "New repository"
# اسم المستودع: contact-cleaner
# اختر Public
# اضغط Create repository
```

### 2. رفع الملفات
```bash
# في مجلد المشروع
git init
git add .
git commit -m "Initial commit: Contact Cleaner Tool"
git branch -M main
git remote add origin https://github.com/[username]/contact-cleaner.git
git push -u origin main
```

### 3. تفعيل GitHub Pages
- اذهب إلى Settings > Pages
- Source: Deploy from a branch
- Branch: main
- اضغط Save

### 4. تحديث الروابط
استبدل `[username]` باسم المستخدم الخاص بك في:
- `sitemap.xml`
- `robots.txt`
- `package.json`
- `README.md`

## الموقع سيكون متاح على:
- العربية: `https://[username].github.io/contact-cleaner/`
- الإنجليزية: `https://[username].github.io/contact-cleaner/en/`

## نصائح إضافية:
- انتظر 5-10 دقائق حتى يتم النشر
- أضف الموقع إلى Google Search Console
- شارك الرابط في وسائل التواصل الاجتماعي 