// متغيرات عامة
let contacts = [];
let cleanedContacts = [];
let originalContacts = [];
let deferredPrompt;

// تهيئة الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeDragAndDrop();
    initializeFileInput();
    initializePWA();
});

// تهيئة PWA
function initializePWA() {
    // استمع لحدث beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        // منع العرض التلقائي للـ prompt
        e.preventDefault();
        // حفظ الـ event للاستخدام لاحقاً
        deferredPrompt = e;
        
        // عرض رسالة تثبيت مخصصة بعد 3 ثوان
        setTimeout(() => {
            showInstallPrompt();
        }, 3000);
    });
    
    // استمع لحدث appinstalled
    window.addEventListener('appinstalled', (evt) => {
        console.log('تم تثبيت التطبيق بنجاح!');
        hideInstallPrompt();
    });
}

// عرض رسالة تثبيت PWA
function showInstallPrompt() {
    // إنشاء عنصر رسالة التثبيت إذا لم يكن موجوداً
    if (!document.getElementById('pwa-install-prompt')) {
        const promptElement = document.createElement('div');
        promptElement.id = 'pwa-install-prompt';
        promptElement.className = 'pwa-install-prompt';
        promptElement.innerHTML = `
            <div class="prompt-content">
                <div class="prompt-text">
                    <strong>📱 تثبيت التطبيق</strong><br>
                    <small>ثبت أداة تنظيف جهات الاتصال على هاتفك للوصول السريع</small>
                </div>
                <div class="prompt-actions">
                    <button class="btn btn-primary" onclick="installPWA()">تثبيت</button>
                    <button class="btn btn-secondary" onclick="hideInstallPrompt()">لاحقاً</button>
                </div>
            </div>
        `;
        document.body.appendChild(promptElement);
    }
    
    // عرض الرسالة
    document.getElementById('pwa-install-prompt').classList.add('show');
}

// إخفاء رسالة تثبيت PWA
function hideInstallPrompt() {
    const promptElement = document.getElementById('pwa-install-prompt');
    if (promptElement) {
        promptElement.classList.remove('show');
    }
}

// تثبيت PWA
function installPWA() {
    if (deferredPrompt) {
        // عرض prompt التثبيت
        deferredPrompt.prompt();
        
        // انتظار اختيار المستخدم
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('وافق المستخدم على تثبيت التطبيق');
            } else {
                console.log('رفض المستخدم تثبيت التطبيق');
            }
            deferredPrompt = null;
        });
    }
    hideInstallPrompt();
}

// تهيئة خاصية السحب والإفلات
function initializeDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// تهيئة إدخال الملف
function initializeFileInput() {
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

// معالجة الملف المحدد
function handleFile(file) {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    if (fileExtension !== 'csv' && fileExtension !== 'vcf') {
        showNotification('يرجى اختيار ملف CSV أو VCF فقط', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const content = e.target.result;
        
        if (fileExtension === 'csv') {
            parseCSV(content);
        } else if (fileExtension === 'vcf') {
            parseVCF(content);
        }
        
        document.getElementById('fileName').textContent = fileName;
        showFileInfo();
        showContactsPreview();
        showNotification('تم تحميل الملف بنجاح!', 'success');
    };
    
    reader.readAsText(file, 'UTF-8');
}

// عرض إشعار
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // إضافة الإشعار للصفحة
    document.body.appendChild(notification);
    
    // إزالة الإشعار تلقائياً بعد 5 ثوان
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// تحليل ملف CSV
function parseCSV(content) {
    const lines = content.split('\n');
    contacts = [];
    
    // البحث عن رؤوس الأعمدة
    let headers = [];
    let dataStartIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            headers = line.split(',').map(h => h.trim().replace(/"/g, ''));
            dataStartIndex = i + 1;
            break;
        }
    }
    
    // البحث عن أعمدة الاسم والهاتف
    let nameIndex = -1;
    let phoneIndex = -1;
    
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase();
        if (header.includes('name') || header.includes('اسم') || header.includes('الاسم')) {
            nameIndex = i;
        } else if (header.includes('phone') || header.includes('mobile') || header.includes('tel') || 
                   header.includes('هاتف') || header.includes('جوال') || header.includes('رقم')) {
            phoneIndex = i;
        }
    }
    
    // إذا لم نجد الأعمدة المطلوبة، نفترض أن العمود الأول هو الاسم والثاني هو الهاتف
    if (nameIndex === -1) nameIndex = 0;
    if (phoneIndex === -1) phoneIndex = 1;
    
    // قراءة البيانات
    for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const values = parseCSVLine(line);
            if (values.length > Math.max(nameIndex, phoneIndex)) {
                const name = values[nameIndex] ? values[nameIndex].trim() : '';
                const phone = values[phoneIndex] ? cleanPhoneNumber(values[phoneIndex].trim()) : '';
                
                if (phone) {
                    contacts.push({
                        name: name,
                        phone: phone,
                        original: line
                    });
                }
            }
        }
    }
    
    originalContacts = [...contacts];
    analyzeContacts();
}

// تحليل سطر CSV مع دعم الاقتباسات
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    values.push(current);
    return values;
}

// تحليل ملف VCF
function parseVCF(content) {
    const cards = content.split('BEGIN:VCARD');
    contacts = [];
    
    for (let i = 1; i < cards.length; i++) {
        const card = cards[i];
        const lines = card.split('\n');
        
        let name = '';
        let phone = '';
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('FN:')) {
                name = trimmedLine.substring(3).trim();
            } else if (trimmedLine.startsWith('TEL')) {
                const phoneMatch = trimmedLine.match(/TEL[^:]*:(.+)/);
                if (phoneMatch) {
                    phone = cleanPhoneNumber(phoneMatch[1].trim());
                }
            }
        }
        
        if (phone) {
            contacts.push({
                name: name,
                phone: phone,
                original: card
            });
        }
    }
    
    originalContacts = [...contacts];
    analyzeContacts();
}

// تنظيف رقم الهاتف
function cleanPhoneNumber(phone) {
    // إزالة جميع الأحرف غير الرقمية
    let cleaned = phone.replace(/[^\d]/g, '');
    
    // إزالة الرموز الدولية الشائعة
    if (cleaned.startsWith('00')) {
        cleaned = cleaned.substring(2);
    }
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }
    
    // إزالة أرقام البلد إذا كانت موجودة
    if (cleaned.startsWith('966') && cleaned.length > 9) {
        cleaned = cleaned.substring(3);
    }
    if (cleaned.startsWith('00966') && cleaned.length > 12) {
        cleaned = cleaned.substring(5);
    }
    
    // إضافة 966 إذا لم تكن موجودة
    if (cleaned.length === 9 && cleaned.startsWith('5')) {
        cleaned = '966' + cleaned;
    }
    
    return cleaned;
}

// تحليل جهات الاتصال
function analyzeContacts() {
    const phoneCounts = {};
    const duplicatePhones = new Set();
    const noNamePhones = new Set();
    
    // حساب تكرار الأرقام
    contacts.forEach(contact => {
        if (phoneCounts[contact.phone]) {
            phoneCounts[contact.phone]++;
            duplicatePhones.add(contact.phone);
        } else {
            phoneCounts[contact.phone] = 1;
        }
        
        // تحديد الأرقام بدون أسماء
        if (!contact.name || contact.name.trim() === '') {
            noNamePhones.add(contact.phone);
        }
    });
    
    // تحديث معلومات الملف
    document.getElementById('totalContacts').textContent = contacts.length;
    document.getElementById('duplicateCount').textContent = duplicatePhones.size;
    document.getElementById('noNameCount').textContent = noNamePhones.size;
    
    // إضافة علامات الحالة
    contacts.forEach(contact => {
        contact.isDuplicate = duplicatePhones.has(contact.phone);
        contact.hasNoName = !contact.name || contact.name.trim() === '';
    });
}

// عرض معلومات الملف
function showFileInfo() {
    document.getElementById('fileInfo').style.display = 'block';
}

// عرض معاينة جهات الاتصال
function showContactsPreview() {
    const contactsList = document.getElementById('contactsList');
    contactsList.innerHTML = '';
    
    contacts.forEach((contact, index) => {
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        
        let status = '';
        if (contact.isDuplicate && contact.hasNoName) {
            status = '<span class="contact-status status-duplicate">🔄 مكرر + بدون اسم</span>';
        } else if (contact.isDuplicate) {
            status = '<span class="contact-status status-duplicate">🔄 مكرر</span>';
        } else if (contact.hasNoName) {
            status = '<span class="contact-status status-no-name">❓ بدون اسم</span>';
        } else {
            status = '<span class="contact-status status-clean">✅ نظيف</span>';
        }
        
        contactItem.innerHTML = `
            <div class="contact-info">
                <div class="contact-name">${contact.name || 'بدون اسم'}</div>
                <div class="contact-phone">${contact.phone}</div>
            </div>
            <div class="contact-status-container">
                ${status}
            </div>
        `;
        
        contactsList.appendChild(contactItem);
    });
    
    document.getElementById('contactsPreview').style.display = 'block';
}

// تنظيف جهات الاتصال
function cleanContacts() {
    const phoneMap = new Map();
    const cleaned = [];
    
    // ترتيب جهات الاتصال بحيث تكون الأسماء أولاً
    const sortedContacts = [...contacts].sort((a, b) => {
        if (a.name && !b.name) return -1;
        if (!a.name && b.name) return 1;
        return 0;
    });
    
    // إزالة المكررات والأرقام بدون أسماء
    sortedContacts.forEach(contact => {
        if (!phoneMap.has(contact.phone)) {
            // إضافة الرقم إذا لم يكن موجوداً من قبل
            phoneMap.set(contact.phone, contact);
            cleaned.push(contact);
        }
    });
    
    cleanedContacts = cleaned;
    
    // عرض النتائج
    showCleanedContacts();
    showNotification(`تم تنظيف ${originalContacts.length - cleanedContacts.length} جهة اتصال!`, 'success');
}

// عرض جهات الاتصال النظيفة
function showCleanedContacts() {
    const cleanedList = document.getElementById('cleanedList');
    cleanedList.innerHTML = '';
    
    cleanedContacts.forEach(contact => {
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        
        contactItem.innerHTML = `
            <div class="contact-info">
                <div class="contact-name">${contact.name || 'بدون اسم'}</div>
                <div class="contact-phone">${contact.phone}</div>
            </div>
            <div class="contact-status-container">
                <span class="contact-status status-clean">✅ نظيف</span>
            </div>
        `;
        
        cleanedList.appendChild(contactItem);
    });
    
    // تحديث الإحصائيات
    document.getElementById('originalCount').textContent = originalContacts.length;
    document.getElementById('cleanedCount').textContent = cleanedContacts.length;
    document.getElementById('removedCount').textContent = originalContacts.length - cleanedContacts.length;
    
    document.getElementById('cleanedContacts').style.display = 'block';
}

// تحميل ملف VCF
function downloadVCF() {
    let vcfContent = '';
    
    cleanedContacts.forEach(contact => {
        vcfContent += 'BEGIN:VCARD\n';
        vcfContent += 'VERSION:3.0\n';
        if (contact.name) {
            vcfContent += `FN:${contact.name}\n`;
            vcfContent += `N:${contact.name};;;;\n`;
        } else {
            vcfContent += 'FN:جهة اتصال\n';
            vcfContent += 'N:جهة اتصال;;;;\n';
        }
        vcfContent += `TEL;TYPE=CELL:${contact.phone}\n`;
        vcfContent += 'END:VCARD\n\n';
    });
    
    downloadFile(vcfContent, 'contacts_cleaned.vcf', 'text/vcard');
    showNotification('تم تحميل ملف VCF بنجاح!', 'success');
}

// تحميل ملف CSV
function downloadCSV() {
    let csvContent = 'Name,Phone\n';
    
    cleanedContacts.forEach(contact => {
        const name = contact.name || 'جهة اتصال';
        csvContent += `"${name}","${contact.phone}"\n`;
    });
    
    downloadFile(csvContent, 'contacts_cleaned.csv', 'text/csv');
    showNotification('تم تحميل ملف CSV بنجاح!', 'success');
}

// دالة التحميل العامة
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// إعادة تعيين الملف
function resetFile() {
    contacts = [];
    cleanedContacts = [];
    originalContacts = [];
    
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('contactsPreview').style.display = 'none';
    document.getElementById('cleanedContacts').style.display = 'none';
    
    document.getElementById('fileInput').value = '';
    showNotification('تم إعادة تعيين الأداة', 'info');
} 