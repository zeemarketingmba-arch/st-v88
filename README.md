<div align="center">
<h1>نظام تقييم الطلاب</h1>
</div>

وصف: واجهة ويب لتسجيل استمارات تقييم الطلاب مع دعم التصدير والتخصيص.

## التشغيل محليًا

المتطلبات: Node.js 18+ و npm

1. تثبيت الحزم:

   npm install

2. إنشاء ملف بيئة محلي وملء المتغيرات (انسخ الملف المثال):

   cp .env.local.example .env.local

   ثم ضع قيمة GEMINI_API_KEY في `.env.local` إذا كنت تستخدم تكامل Gemini.

3. تشغيل وضع التطوير:

   npm run dev

4. بناء نسخة الإنتاج:

   npm run build

ملاحظات:
- لا تقم بإضافة ملفات مثل `.env.local` أو `node_modules/` إلى المستودع (تمّت إضافة `.gitignore`).
- عدِّل اسم المستودع في `package.json` و `repository.url` قبل رفعه إلى GitHub.
# st-v88
