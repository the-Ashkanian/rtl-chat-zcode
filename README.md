# rtl-chat-zcode

RTL (right-to-left) chat patch for **ZCode Desktop** — makes Persian/Arabic messages display right-aligned, while English stays left-aligned.

> **Note:** This is a community-made patch. It modifies ZCode's internal `app.asar` file to auto-load a small browser extension. NOT affiliated with ZCode. Re-apply after every ZCode update.

## One-click install (Windows)

Double-click **`install-rtl.bat`**. It does everything automatically:

1. finds your ZCode install (user or Program Files),
2. closes ZCode if it is running,
3. asks for administrator rights **only** when ZCode is in Program Files (one UAC click),
4. applies the patch and tells you when to reopen ZCode.

Requires [Node.js](https://nodejs.org). After every ZCode update, double-click the same file again.

## Quick install (Windows, PowerShell)

1. **Clone or download** this repo (green `Code` button → Download ZIP, then extract).
2. **Fully quit ZCode** (tray icon → Quit; `Ctrl+Shift+Esc` → End task `ZCode.exe` if needed).
3. Open **Windows PowerShell as Administrator**.
4. `cd` into the repo folder:

```powershell
cd "C:\path\to\rtl-chat-zcode"
```

5. Find where ZCode is installed:

```powershell
Get-ChildItem -Path "$env:LOCALAPPDATA\Programs","C:\Program Files" -Filter "ZCode.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 3 FullName
```

6. Apply the patch (one line — note the `;` in the middle):

```powershell
$env:ZCODE_ASAR = "<path-from-step-5>\resources\app.asar"; node asar-work\patch-asar.mjs --apply
```

You should see `APPLY DONE` at the end.

7. Open ZCode normally. Look for the small red **RTL** badge (bottom-right).
8. Send a Persian message → right-aligned. Send an English message → left-aligned.

After every ZCode update, repeat steps 2–6.

---

<details>
<summary>🇮🇷 آموزش فارسی (کلیک کنید)</summary>

# RTL Chat برای ZCode Desktop

پکیج کوچک برای **راستچین (RTL) کردن چت فارسی** در ZCode.

اگر تا حالا با ZCode فارسی تایپ کردهاید و متنها برعکس چیده میشوند، این پکیج همان مشکل را درست میکند.

**نسخه:** 0.2.3
**سیستمعامل:** ویندوز (روی هر دو نصبِ `C:\Program Files\ZCode` و نصبِ کاربری `AppData\Local\Programs\ZCode` آزموده شده)
**پیشنیاز:**
- نصب بودن [Node.js](https://nodejs.org) (موقع نصب، تیکهای پیشفرض را نگه دارید)
- همه دستورهای این آموزش برای **Windows PowerShell** است (ترمینال آبی ویندوز). اگر CMD باز کنید، بعضی دستورها فرق دارند.

---

## این zip چیست؟ (به زبان ساده)

مثل یک **چسبانه** است:

1. یک **افزونه کوچک مرورگر** داریم که CSS/JS مخصوص راستچین را داخل صفحه چت میریزد (`extension/`).
2. ZCode از جعبهاش این افزونه را لود **نمیکند**. برای همین یک **پچ کوچک** روی فایل داخلی `app.asar` میزنیم تا هر بار که ZCode باز میشود، خودش این افزونه را بالا بیاورد.
3. بعد از یک بار پچ کردن، دفعات بعد فقط مثل همیشه ZCode را باز میکنید — دیگر فلگ خاصی لازم نیست.

---

## فهرست فایلها

| فایل / پوشه | چیست؟ |
|-------------|--------|
| `extension/manifest.json` | معرفی افزونه برای مرورگر/الکترون |
| `extension/rtl-chat.js` | کد اصلی راستچین (همین داخل صفحه اجرا میشود) |
| `rtl-chat.js` | **نسخه منبع** — اگر خواستید کد را ویرایش کنید، این را عوض کنید و بعد در `extension\rtl-chat.js` کپی کنید |
| `asar-work/patch-asar.mjs` | اسکریپت پچ کردن `app.asar` (فاز اصلی نصب) |
| `verify-no-inject.mjs` | فقط **خواندن** وضعیت — برای مطمئن شدن که پچ کار میکند |
| `start-zcode-rtl.bat` | راه اضطراری/قدیمی: باز کردن ZCode با فلگ + تزریق دستی (اگر پچ جواب نداد) |
| `inject-cdp.mjs` | تزریق دستی از راه پورت دیباگ (همراه bat) |

داخل `asar-work\` بعد از اولین اجرا، فایل بکاپ `app.asar.bak` ساخته میشود. آن را پاک نکنید تا بتوانید برگردانید.

---

## نصب — هشت قدم (برای اولین بار)

### قدم ۱ — فایل زیپ را باز کنید

روی `rtl-chat-patch-0.2.3.zip` راستکلیک کنید → **Extract All...** → یک پوشه به اسم `rtl-chat-patch` ساخته میشود.

جای پوشه هر جا میخواهد باشد (دسکتاپ، دانلودها، ...) — فقط در قدم ۴ آدرس واقعیاش را بدهید.

### قدم ۲ — ZCode را کامل ببندید

نه فقط پنجره را ببندید. اگر آیکون در سینی سیستم (گوشه راست پایین کنار ساعت) هست، روی آن راستکلیک و **Quit / خروج** بزنید.

چک: `Ctrl+Shift+Esc` → اگر `ZCode.exe` در لیست هست، آن را **End task** کنید.

### قدم ۳ — ترمینال PowerShell را باز کنید

دکمه ویندوز را بزنید → تایپ کنید `powershell` → روی **Windows PowerShell** راستکلیک → **Run as administrator**.

> چرا Admin؟ اگر ZCode زیر `Program Files` نصب باشد، فایل `app.asar` مال ویندوز است و بدون دسترسی مدیر، نوشتن در آن خطا میدهد (`EPERM`). اگر نصب شما کاربری باشد (قدم ۵ مشخص میکند) هم Admin بیضرر است. پس برای سادگی همیشه Admin بزنید.

### قدم ۴ — بروید داخل پوشه پچ

```powershell
cd "C:\Users\YOU\Desktop\rtl-chat-patch"
```

مسیر را با جایی که واقعاً پوشه را باز کردهاید عوض کنید.

> ⚠️ اگر گفت **`Cannot find path ... because it does not exist`** و مطمئنید پوشه هست، شاید دسکتاپ شما داخل OneDrive است. این را بزنید تا مسیر واقعی دسکتاپ را بگوید:
>
> ```powershell
> [Environment]::GetFolderPath('Desktop')
> ```
>
> خروجی (مثلاً `C:\Users\YOU\OneDrive\Desktop`) را در دستور `cd` بالا بگذارید.

> ⚠️ اگر گفت **`A positional parameter cannot be found`** یعنی `/d` بعد از `cd` نوشتید. آن مال CMD است — در PowerShell فقط `cd "مسیر"` بزنید.

### قدم ۵ — بگویید ZCode کجا نصب شده

بعضیها زیر `Program Files`، بعضیها زیر `AppData`. ویندوز بگوید:

```powershell
Get-ChildItem -Path "$env:LOCALAPPDATA\Programs","C:\Program Files" -Filter "ZCode.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 3 FullName
```

خروجی چیزی شبیه این است:

```
C:\Users\YOU\AppData\Local\Programs\ZCode\ZCode.exe
```

یا:

```
C:\Program Files\ZCode\ZCode.exe
```

این مسیر را یادداشت کنید — در قدم ۶ لازم میشود.

### قدم ۶ — پچ را بزنید

یک خط زیر را کامل کپی کنید و بچسبانید (دقت کنید **«;»** بین دو بخش هست):

```powershell
$env:ZCODE_ASAR = "جای_قدم_۵\resources\app.asar"; node asar-work\patch-asar.mjs --apply
```

مثال برای نصب کاربری:

```powershell
$env:ZCODE_ASAR = "C:\Users\YOU\AppData\Local\Programs\ZCode\resources\app.asar"; node asar-work\patch-asar.mjs --apply
```

مثال برای نصب زیر Program Files:

```powershell
$env:ZCODE_ASAR = "C:\Program Files\ZCode\resources\app.asar"; node asar-work\patch-asar.mjs --apply
```

پیامهای سالم چیزی شبیه به اینهاست:

- `already patched` یا `APPLY DONE`
- `has load-extension true`
- `has loadExtension true`

اگر **`app.asar not found`** دیدید: یعنی مسیر قدم ۵ اشتباه است یا `resources\app.asar` آخرش نیست — مسیر را درست کنید و دوباره بزنید.

اگر **`anchor ... missing`** دیدید: یعنی نسخه ZCode فرق کرده و این پچ با این ورژن نمیخواند — اسکرینشات خطا را برای کسی که پکیج را داده بفرستید.

### قدم ۷ — ZCode را عادی باز کنید

مثل همیشه، بدون هیچ فلگ اضافه — همان آیکون دسکتاپ.

### قدم ۸ — چک کنید کار کرده

1. چند ثانیه صبر کنید.
2. در **گوشه پایین-راست** پنجره ZCode باید یک برچسب قرمز کوچک **RTL** ببینید.
3. یک پیام فارسی بفرستید: باید **راستچین** باشد و حباب پیام شما سمت **راست** بماند.
4. یک پیام انگلیسی بفرستید: باید **چپچین** بماند (جهت از **اولین کلمه** تشخیص داده میشود).
5. کد، جدول و ریاضیات همچنان چپچین و مرتب میمانند.

**تمام.** از این به بعد هر بار فقط ZCode را عادی باز کنید.

---

## تأیید فنی (اختیاری — فقط خواندن)

اگر برچسب RTL نمیبینید یا میخواهید مطمئن شوید:

1. ZCode را **کامل** ببندید.
2. این را در پوشه پچ بزنید (Admin یا عادی فرقی ندارد):

```powershell
Start-Process "جای_قدم_۵\ZCode.exe" -ArgumentList "--remote-debugging-port=9229"
```

3. چند ثانیه صبر کنید، بعد (در همان پوشه پچ):

```powershell
node verify-no-inject.mjs
```

خروجی باید شامل اینها باشد:

- `badge=true`
- `style=true`
- `rtlAttr=on`

اگر همه `false` بود → پچ apply نشده یا ZCode آپدیت شده و پچ پاک شده (بخش بعدی).

> نکته: `vias` و `booted` ممکن است خالی/false باشند. این طبیعی است — افزونه در «دنیای ایزوله» مرورگر اجرا میشود. مدرک واقعی همان **badge** و **style** در DOM است.

بعد از تست، ZCode را کامل ببندید و دفعات بعد عادی باز کنید (پورت 9229 فقط برای تأیید لازم است).

---

## بعد از آپدیت ZCode

آپدیت خودکار ZCode فایل `app.asar` را با نسخه اصلی **جایگزین** میکند و پچ از بین میرود.

هر وقت بعد از آپدیت برچسب RTL ناپدید شد:

1. ZCode را کامل ببندید.
2. ترمینال PowerShell را در پوشه پچ باز کنید (قدم ۳ و ۴) و همان دستور قدم ۶ را دوباره بزنید:

```powershell
$env:ZCODE_ASAR = "جای_قدم_۵\resources\app.asar"; node asar-work\patch-asar.mjs --apply
```

3. ZCode را عادی باز کنید.

اگر بعد از آپدیت خطای `anchor ... missing` گرفتید: ممکن است ساختار داخلی ZCode عوض شده باشد. آن موقع این پچ باید بهروز شود — ریپو/فایل جدید بخواهید.

---

## اگر پچ جواب نداد (راه اضطراری)

این روش پچ `app.asar` نمیخواهد؛ فقط برای همان جلسه ZCode را با فلگ باز میکند و افزونه را دستی لود میکند.

**قدم ۱ — ZCode را کامل ببندید** (مثل قبل).

**قدم ۲ — bat را اجرا کنید** (در پوشه پچ، ترجیحاً Admin):

```powershell
.\start-zcode-rtl.bat
```

بعد چند ثانیه: برچسب RTL باید بیاید.

**قدم ۳ — (اختیاری) تأیید:**

```powershell
node inject-cdp.mjs --verify
```

---

## بازگردانی به حالت قبل از پچ

اگر خواستید همهچیز را مثل اول کنید:

1. ZCode را کامل ببندید.
2. در پوشه پچ (Admin اگر نصب Program Files است):

```powershell
Copy-Item -Force asar-work\app.asar.bak "جای_قدم_۵\resources\app.asar"
```

(اگر خطای دسترسی گرفتید، ترمینال را با Run as administrator باز کنید و دوباره بزنید.)

3. ZCode را باز کنید. دیگر خبری از RTL نیست.

---

## ویرایش کد (اگر خواستید چیزی عوض کنید)

1. `rtl-chat.js` (منبع) را ویرایش کنید.
2. کپی کنید داخل پوشه افزونه:

```powershell
Copy-Item -Force rtl-chat.js extension\rtl-chat.js
```

3. کد را چک کنید:

```powershell
node --check rtl-chat.js
```

4. ZCode را کامل ببندید و دوباره باز کنید (پچ `app.asar` همان مسیر `extension` را لود میکند — نیازی به زدن دوبارهٔ patch نیست، مگر اینکه **مسیر پوشه zip** را عوض کرده باشید؛ آنوقت دوباره قدم ۶ را بزنید).

---

## عیبیابی سریع

| مشکل | چه کنیم |
|------|---------|
| `Cannot find path ... does not exist` | مسیر دسکتاپ را با `[Environment]::GetFolderPath('Desktop')` بگیرید (بعضیها OneDrive دارند). |
| `A positional parameter cannot be found` | دارید با CMD می‌زنید یا `/d` گذاشتید. در PowerShell فقط `cd "مسیر"`. |
| `app.asar not found` | مسیر قدم ۵ را چک کنید؛ حتماً باید `...\resources\app.asar` تمام شود. |
| برچسب RTL نیست | ZCode را کامل ببندید و دوباره باز کنید. اگر آپدیت شده، دوباره پچ بزنید. |
| خطا `EPERM` موقع patch | با Terminal **Admin** اجرا کنید (یا در قدم ۶ مسیر `ZCODE_ASAR` را درست کنید). |
| خطا `anchor missing` | نسخه ZCode فرق کرده — این پچ با آن ورژن نمیخواند. |
| `node` پیدا نشد | Node را نصب کنید و ترمینال را **ببندید و دوباره** باز کنید. |
| CDP جواب نمیدهد | مطمئن شوید با `--remote-debugging-port=9229` باز شده (بخش تأیید). |
| چت هنوز چپچین است | بررسی: `node verify-no-inject.mjs` → آیا `badge=true` است؟ |
| پوشه را جابجا کردم و خراب شد | دوباره قدم ۶ را بزنید (مسیر extension نسبی است و باید خودش پیدا کند). |

---

## نکتههای امنیتی / عملی

- پچ فقط **یک فایل داخلی نصب ZCode** (`app.asar`) را تغییر میدهد و افزونه را از **پوشه همین zip** لود میکند. پوشه را بعداً پاک نکنید، وگرنه ZCode موقع بالا آمدن افزونه را پیدا نمیکند (خطای ظریف، چت برمیگردد به حالت چپچین).
- موقع آپدیت ZCode، پچ از بین میرود — هر بار بعد از آپدیت دوباره بزنید.
- قبل از هر چیز، `asar-work\app.asar.bak` را نگه دارید.
- locale رسمی ZCode فقط `system` / `zh-CN` / `en-US` است؛ راستچین از تنظیمات داخلی خود ZCode نمیآید — برای همین این پکیج لازم است.

---

## خلاصه یک خطی

**ببند → PowerShell: `cd "پوشه پچ"` → پچ بزن (`$env:ZCODE_ASAR=...; node asar-work\patch-asar.mjs --apply`) → عادی باز کن → دنبال برچسب قرمز RTL بگرد.**

بعد از هر آپدیت ZCode، همان یک خط پچ را دوباره بزن.

</details>
