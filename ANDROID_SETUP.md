# دليل تشغيل وبناء تطبيق أندرويد (Emerging Android App)

تطبيق **Emerging** أصبح الآن مشروعاً مهيئاً بالكامل كنظام هجين عالي الأداء (Full-Stack Web + Native Android) باستخدام **Capacitor 8** و **React 19** و **Express WebSocket**.

---

## 📱 معلومات الحزمة (App Identification)
- **اسم التطبيق:** Emerging
- **معرف الحزمة (Package ID):** `com.mohammedabderahman.emerging`
- **الهدف المستهدف (Target SDK):** Android 14 / 15 (API 34/35)
- **الحد الأدنى المدعوم (Min SDK):** Android 7.0 (API 24)

---

## 🚀 طرق بناء وتوليد ملف الـ APK

### 1. الطريقة الأولى: عبر Android Studio (الموصى بها للمطورين)
1. تأكد من بناء أحدث ملفات الويب:
   ```bash
   npm run android:sync
   ```
2. افتح مشروع أندرويد مباشرة داخل Android Studio:
   ```bash
   npx cap open android
   ```
3. من القائمة العلوية في Android Studio:
   - اختر: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
   - ستجد ملف الـ APK في المسار:
     `android/app/build/outputs/apk/debug/app-debug.apk`

---

### 2. الطريقة الثانية: عبر سطر الأوامر (Command Line)
إذا كان لديك Java JDK (الإصدار 17 أو 21) و Android SDK مثبتين على جهازك:
```bash
# 1. بناء ملفات الواجهة ومزامنتها
npm run android:sync

# 2. الانتقال لمجلد أندرويد وبناء الـ APK
cd android
./gradlew assembleDebug

# في نظام Windows:
# gradlew.bat assembleDebug
```
الملف الناتج:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

### 3. الطريقة الثالثة: البناء التلقائي عبر GitHub Actions (سحابياً بدون تثبيت أي برامج)
تم إنشاء سير عمل متكامل في المسار:
`.github/workflows/android-build.yml`

بمجرد رفع المشروع إلى مستودعك على GitHub وعمل Push أو الضغط على **Run workflow**:
1. سيقوم GitHub Actions بتجهيز بيئة Linux مع JDK 21 و Android SDK تلقائياً.
2. بناء التطبيق وتوليد الـ APK.
3. يمكنك تحميل ملف الـ APK النهائي مباشرة من تبويب **Actions** كـ Artifact جاهز للتثبيت على أي هاتف!

---

## 🌐 ضبط خادم الإنتاج للـ APK (Production Backend)

عند تثبيت الـ APK على هاتف محمول، لا يمكن للتطبيق الاتصال بـ `localhost`. تم تجهيز كود التطبيق في `src/config.ts` ليقرأ روابط الخادم ديناميكياً من متغيرات البيئة:

في ملف `.env` (أو إعدادات البناء):
```env
# رابط خادم الـ API المنشور (مثال: Render أو Railway أو VPS أو Cloud Run)
VITE_API_URL="https://your-domain.com"

# رابط الـ WebSocket للدردشة المباشرة
VITE_WS_URL="wss://your-domain.com"
```

إذا لم يتم تحديد `VITE_WS_URL`، فسيقوم التطبيق تلقائياً باشتقاقه من `VITE_API_URL` (تحويل `https://` إلى `wss://`).

---

## 🛡️ الصلاحيات المضمنة في AndroidManifest.xml
- `INTERNET`: للاتصال بالخادم والـ WebSocket.
- `ACCESS_NETWORK_STATE`: لمراقبة حالة الاتصال بالشبكة.
- `RECORD_AUDIO`: لتسجيل الرسائل الصوتية.
- `MODIFY_AUDIO_SETTINGS`: للمكالمات الصوتية والمرئية.
- `CAMERA`: للمكالمات المرئية وإرفاق الصور من الكاميرا.
- `POST_NOTIFICATIONS`: لإشعارات الرسائل الواردة (Android 13+).
- `VIBRATE`: للاهتزاز اللمسي مع إرسال الرسائل والتنبيهات.

---

## ⚡ الميزات الأصلية المضافة (Native Capabilities)
1. **زر الرجوع الفعلي (Hardware Back Button):**
   - إغلاق المكالمة النشطة إذا كانت جارية.
   - إغلاق النوافذ المنبثقة (الحالات، جهات الاتصال، الإعدادات).
   - العودة من شاشة المحادثة إلى قائمة الدردشات على الهواتف.
   - الخروج من التطبيق عند الضغط في الشاشة الرئيسية.
2. **شريط الحالة (StatusBar):**
   - يتناسق تلقائياً مع الثيم الليلي والنهاري للتطبيق.
3. **شاشة البداية (Splash Screen):**
   - إخفاء سلس وفوري بعد اكتمال تحميل الواجهة.
4. **التغذية اللمسية (Haptic Feedback):**
   - نبضات اهتزاز خفيفة وواقعية عند إرسال الرسائل والتفاعل.
5. **الإشعارات المحلية (Local Notifications):**
   - تنبيه المستخدم عند وصول رسائل جديدة أثناء وجوده في شاشة أخرى.
