import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import https from "https";
import http from "http";
import crypto from "crypto";
import { execFile } from "child_process";
import { createServer as createViteServer } from "vite";
import multer from "multer";

const app = express();
const PORT = parseInt(process.env.PORT as string, 10) || 3000;
const YTDLP_PATH = path.resolve(process.cwd(), 'yt-dlp');
const DATA_DIR = path.resolve(process.cwd(), 'data');
const COOKIES_PATH = path.join(DATA_DIR, 'cookies.txt');

// إعداد رفع الملفات باستخدام multer
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // إنشاء مجلد data إذا لم يكن موجوداً
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      cb(null, DATA_DIR);
    },
    filename: (req, file, cb) => {
      // حفظ الملف باسم cookies.txt لليوتيوب، أو باسم مخصص للمنصات الأخرى
      if (req.params && req.params.platform) {
        cb(null, `cookies_${req.params.platform.toLowerCase()}.txt`);
      } else {
        cb(null, 'cookies.txt');
      }
    }
  })
});

app.use(express.json());
// تفعيل CORS للسماح بالطلبات من أي نطاق
app.use(cors({ origin: '*' }));

let downloadPromise: Promise<boolean> | null = null;

// ذاكرة التخزين المؤقت (In-Memory Cache)
// لتخزين نتائج التحليل مع taskId
const cache = new Map<string, any>();

// دالة لتنظيف الذاكرة المؤقتة كل 30 دقيقة لمنع تسرب الذاكرة
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > 30 * 60 * 1000) {
      cache.delete(key);
    }
  }
}, 60 * 1000);

let ytdlpVersion = 'unknown';

// دالة مساعدة لتحميل ملف التشغيل الخاص بـ yt-dlp في حال لم يكن موجوداً
async function ensureYtDlp() {
  if (fs.existsSync(YTDLP_PATH)) {
    const stats = fs.statSync(YTDLP_PATH);
    if (stats.size > 1000000) { // Should be ~30MB
      await updateYtDlp();
      return;
    }
  }

  if (downloadPromise) return downloadPromise;

  console.log("جاري تحميل yt-dlp...");
  downloadPromise = new Promise((resolve, reject) => {
    const url = process.platform === 'win32' 
      ? "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
      : "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux";

    execFile('curl', ['-L', url, '-o', YTDLP_PATH], (error) => {
      if (error) {
        console.error("فشل تحميل yt-dlp:", error);
        fs.unlink(YTDLP_PATH, () => {});
        downloadPromise = null;
        reject(error);
      } else {
        if (process.platform !== 'win32') fs.chmodSync(YTDLP_PATH, '755');
        console.log("تم تحميل yt-dlp بنجاح.");
        downloadPromise = null;
        updateYtDlp().then(() => resolve(true)).catch(() => resolve(true));
      }
    });
  });

  return downloadPromise;
}

// تحديث yt-dlp عند تشغيل الخادم لأول مرة فقط
async function updateYtDlp() {
  return new Promise<void>((resolve) => {
    console.log("جاري تحديث yt-dlp...");
    execFile(YTDLP_PATH, ['-U'], (error, stdout) => {
      if (error) {
        console.error("فشل تحديث yt-dlp (تم التجاهل للاستمرار):", error);
      } else {
        console.log("تم تحديث yt-dlp بنجاح:\n", stdout);
      }
      
      // استخراج الإصدار الحقيقي
      execFile(YTDLP_PATH, ['--version'], (verError, verStdout) => {
         if (!verError && verStdout) {
             ytdlpVersion = verStdout.trim();
         }
         resolve();
      });
    });
  });
}

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    ytdlp_version: ytdlpVersion
  });
});


// 1. نقطة النهاية لتحليل الرابط واستخراج البيانات
app.post("/api/analyze", async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url || !url.startsWith("http")) {
      return res.status(400).json({ success: false, error: "رابط غير صالح" });
    }

    // التحقق من الـ Cache أولاً
    for (const [key, value] of cache.entries()) {
      if (value.originalUrl === url) {
        if (Date.now() - value.timestamp <= 30 * 60 * 1000) {
          console.log(`Serving from cache: ${url}`);
          const safeFormats = value.info.formats.map((f: any) => ({
              format_id: f.format_id,
              ext: f.ext,
              resolution: f.resolution || (f.height ? `${f.height}p` : 'صوت فقط'),
              filesize: f.filesize || f.filesize_approx,
              vcodec: f.vcodec !== 'none',
              acodec: f.acodec !== 'none',
              format_note: f.format_note
          }));
          const safeInfo = { ...value.info, formats: safeFormats };
          return res.json({ success: true, taskId: key, info: safeInfo, fromCache: true });
        }
      }
    }

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    await ensureYtDlp();

    console.log(`Analyzing URL: ${url}`);
    
    // دالة لحفظ النتيجة في الذاكرة المؤقتة
    const saveAndRespond = (info: any, fullFormats: any[]) => {
      // إرسال معلومات الصيغ للواجهة بدون الرابط المباشر
      const safeFormats = fullFormats.map((f: any) => ({
          format_id: f.format_id,
          ext: f.ext,
          resolution: f.resolution || (f.height ? `${f.height}p` : 'صوت فقط'),
          filesize: f.filesize || f.filesize_approx,
          vcodec: f.vcodec !== 'none',
          acodec: f.acodec !== 'none',
          format_note: f.format_note
      }));

      const cachedInfo = { ...info, formats: fullFormats };
      const safeInfo = { ...info, formats: safeFormats };

      const taskId = crypto.randomUUID();
      // تخزين النتائج في الذاكرة (Cache)
      cache.set(taskId, {
        timestamp: Date.now(),
        info: cachedInfo,
        originalUrl: url
      });

      // إعادة البيانات للواجهة بنفس التنسيق الحالي
      res.json({ success: true, taskId, info: safeInfo, fromCache: false });
    };

    const runYtDlp = async (targetUrl: string, extraArgs: string[] = [], retries = 1): Promise<any> => {
      let currentTry = 0;
      while (currentTry <= retries) {
        try {
          return await new Promise((resolve, reject) => {
            const cmdArgs = [
              "--dump-json",
              "--skip-download",
              "--no-playlist",
              "--no-check-certificate",
              "--socket-timeout", "10",
              "--no-warnings"
            ];
            
            cmdArgs.push(...extraArgs);
            cmdArgs.push(targetUrl);
            
            execFile(YTDLP_PATH, cmdArgs, { maxBuffer: 1024 * 1024 * 10, timeout: 45000 }, (error, stdout, stderr) => {
               if (error) reject({ error, stderr });
               else resolve(stdout);
            });
          });
        } catch (err: any) {
          currentTry++;
          // إذا كان الخطأ بسبب Timeout نعيد المحاولة مرة واحدة
          if (err.error && err.error.killed && currentTry <= retries) {
            console.log(`Timeout occurred. Retrying (${currentTry}/${retries})...`);
            continue;
          }
          throw err;
        }
      }
    };
    
    const processYtDlpOutput = (stdout: string) => {
        if (!stdout || !stdout.trim()) throw new Error("Empty stdout");
        const data = JSON.parse(stdout);
        const fullFormats = data.formats
          .filter((f: any) => f.url && f.ext !== 'mhtml' && (f.vcodec !== 'none' || f.acodec !== 'none'))
          .reverse();

        const info = {
          title: data.title,
          thumbnail: data.thumbnail,
          duration: data.duration,
          uploader: data.uploader,
          extractor: data.extractor_key
        };
        return { info, fullFormats };
    };

    if (isYouTube) {
        // ترتيب البحث لملفات يوتيوب كما طلب المستخدم
        // سبب الاحتفاظ بالملف "cookies.txt" كخيار احتياطي ليوتيوب هو للتوافق مع الإصدارات القديمة
        const youtubeCookiePaths = [
            path.join(DATA_DIR, 'cookies_youtube_com.txt'),
            path.join(DATA_DIR, 'cookies_youtube.txt'),
            COOKIES_PATH // data/cookies.txt
        ];

        let selectedCookiePath = null;
        // ترتيب الأولوية في اختيار ملف Cookies ليوتيوب
        for (const cp of youtubeCookiePaths) {
            if (fs.existsSync(cp)) {
                selectedCookiePath = cp;
                break;
            }
        }

        // التحقق من وجود أي من ملفات الكوكيز ليوتيوب
        if (!selectedCookiePath) {
            return res.status(400).json({
                success: false,
                error: "ملف cookies.txt غير موجود. ارفعه أولاً من واجهة الموقع."
            });
        }

        try {
            console.log(`Analyzing YouTube Video with ${path.basename(selectedCookiePath)}...`);
            
            // استخدام الكوكيز المرفوعة فقط مع yt-dlp
            const extraArgs = [
               "--cookies", selectedCookiePath,
               "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
               "--js-runtimes", `node:${process.execPath}`,
               "--extractor-args", "youtube:player_client=ios"
            ];
            
            // تنظيف الرابط من معلمات التتبع إن وجدت
            const cleanUrl = url.split('&')[0];
            
            const stdout = await runYtDlp(cleanUrl, extraArgs);
            const { info, fullFormats } = processYtDlpOutput(stdout);
            
            // تخزين النتائج في الذاكرة (Cache) وأعد البيانات
            return saveAndRespond(info, fullFormats);
            
        } catch (e: any) {
            console.error("YouTube Error:", e);
            let errorMessage = "تعذر استخراج البيانات من اليوتيوب. تأكد من صلاحية الكوكيز أو أن الفيديو غير محذوف.";
            if (e.stderr) {
                const match = e.stderr.match(/ERROR: (.*)/);
                if (match) errorMessage = `خطأ من يوتيوب: ${match[1]}`;
            }
            if (e.error && e.error.killed) errorMessage = "انتهت مهلة التحليل. يرجى المحاولة مرة أخرى.";
            return res.status(400).json({ success: false, error: errorMessage });
        }
    } else {
       // تشغيل المنصات الأخرى بشكل اعتيادي بدون كوكيز أولاً
       try {
         const extraArgs = [
           "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
         ];
         const stdout = await runYtDlp(url, extraArgs);
         const { info, fullFormats } = processYtDlpOutput(stdout);
         return saveAndRespond(info, fullFormats);
       } catch (e: any) {
         // التحقق مما إذا كان الخطأ يتطلب ملف كوكيز
         const stderrLower = (e.stderr || "").toLowerCase();
         const needsCookies = stderrLower.includes('login') || 
                              stderrLower.includes('empty media response') ||
                              stderrLower.includes('private') ||
                              stderrLower.includes('sign in') ||
                              stderrLower.includes('cookies');
                              
         if (needsCookies) {
             // استخراج Domain و Platform
             // استخراج اسم النطاق الكامل (Domain)
             // مثال: instagram.com أو tiktok.com
             const domainMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([^/]+)/i);
             const rawDomain = domainMatch ? domainMatch[1].toLowerCase() : 'unknown';
             
             // استخراج اسم المنصة الأساسي (Platform) عن طريق حذف الامتدادات الشائعة
             // نحذف .com, .net, .org, .co وأي امتداد مشابه ليتبقى اسم المنصة فقط
             const platform = rawDomain.replace(/\.(com|net|org|co|info|biz|tv|me|io|be|app|xyz)(?:\.[a-z]{2})?$/i, '');
             
             // استبدال النقاط في الـ Domain بشرطة سفلية
             const domainSafe = rawDomain.replace(/\./g, '_');
             
             // سبب البحث بأكثر من اسم هو لدعم الملفات المرفوعة بالاسمين
             const domainCookiePath = path.join(DATA_DIR, `cookies_${domainSafe}.txt`);
             const platformCookiePath = path.join(DATA_DIR, `cookies_${platform}.txt`);
             
             let selectedCookiePath = null;
             
             // ترتيب الأولوية في اختيار ملف Cookies:
             // أولاً: data/cookies_{domain}.txt
             // إذا لم يوجد، ثانياً: data/cookies_{platform}.txt
             if (fs.existsSync(domainCookiePath)) {
                 selectedCookiePath = domainCookiePath;
             } else if (fs.existsSync(platformCookiePath)) {
                 selectedCookiePath = platformCookiePath;
             }
             
             // التحقق من وجود ملف الكوكيز الخاص بالمنصة
             if (selectedCookiePath) {
                 try {
                     console.log(`Analyzing ${platform} Video with ${path.basename(selectedCookiePath)}...`);
                     const retryArgs = [
                         "--cookies", selectedCookiePath,
                         "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                     ];
                     const stdoutRetry = await runYtDlp(url, retryArgs);
                     const { info, fullFormats } = processYtDlpOutput(stdoutRetry);
                     return saveAndRespond(info, fullFormats);
                 } catch (retryError: any) {
                     let errorMessage = `تعذر استخراج البيانات من ${platform} حتى مع استخدام ملف الكوكيز.`;
                     if (retryError.stderr) {
                         const match = retryError.stderr.match(/ERROR: (.*)/);
                         if (match) errorMessage = `خطأ من ${platform}: ${match[1]}`;
                     }
                     if (retryError.error && retryError.error.killed) errorMessage = "انتهت مهلة التحليل. يرجى المحاولة مرة أخرى.";
                     return res.status(400).json({ success: false, error: errorMessage });
                 }
             } else {
                 // في حال عدم وجود الملف، نرجع الرسالة العربية كما طلب المستخدم
                 return res.status(400).json({
                     success: false,
                     error: `هذه المنصة تحتاج ملف Cookies. يرجى رفع الملف cookies_${domainSafe}.txt.`
                 });
             }
         } else {
             let errorMessage = "تعذر استخراج البيانات من الرابط. قد يكون غير مدعوم أو خاص.";
             if (e.stderr) {
                const match = e.stderr.match(/ERROR: (.*)/);
                if (match) errorMessage = `خطأ من الخادم: ${match[1]}`;
             }
             if (e.error && e.error.killed) errorMessage = "انتهت مهلة التحليل. يرجى المحاولة مرة أخرى.";
             return res.status(400).json({ success: false, error: errorMessage });
         }
       }
    }
  } catch (err) {
    next(err); // استخدام معالج الأخطاء العام لـ Express
  }
});

// 2. نقطة النهاية لتحميل الفيديو كوكيل (Proxy Download)
app.get("/api/download", (req, res) => {
  const { taskId, formatId } = req.query;
  
  if (!taskId || !formatId) {
    return res.status(400).send("معلمات غير صالحة");
  }

  const cachedData = cache.get(taskId as string);
  if (!cachedData) {
    return res.status(404).send("انتهت صلاحية الجلسة. يرجى تحليل الرابط مرة أخرى.");
  }

  const format = cachedData.info.formats.find((f: any) => f.format_id === formatId);
  if (!format || !format.url) {
    return res.status(404).send("الصيغة المطلوبة غير موجودة");
  }

  const directUrl = format.url;
  // تنظيف اسم الملف من الرموز الخاصة لتجنب الأخطاء
  const cleanTitle = cachedData.info.title.replace(/[^\w\s\u0600-\u06FF-]/gi, '').trim().replace(/\s+/g, '_');
  const fileName = `${cleanTitle}.${format.ext}`;

  console.log(`Starting proxy download for: ${fileName}`);

  // تعيين رؤوس الإجبار على التحميل (Content-Disposition: attachment)
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader("Content-Type", "application/octet-stream");

  // دالة لجلب الفيديو من الرابط المباشر وإعادة توجيهه للمستخدم
  const streamFromUrl = (url: string) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (response) => {
      // التعامل مع إعادة التوجيه
      if (response.statusCode === 302 || response.statusCode === 301 || response.statusCode === 303 || response.statusCode === 307) {
        if (response.headers.location) {
          streamFromUrl(response.headers.location);
          return;
        }
      }
      
      if (response.statusCode && response.statusCode >= 400) {
        console.error(`Error downloading from direct URL: ${response.statusCode}`);
        if (!res.headersSent) {
           res.status(500).send("فشل التحميل من المصدر. الرابط المباشر غير متاح حالياً.");
        }
        return;
      }

      if (response.headers["content-length"]) {
        res.setHeader("Content-Length", response.headers["content-length"]);
      }
      if (response.headers["content-type"]) {
        res.setHeader("Content-Type", response.headers["content-type"]);
      }

      // توجيه المحتوى (Stream)
      response.pipe(res);
      
      response.on('error', (err) => {
        console.error("Stream response error:", err);
        if (!res.headersSent) res.status(500).end();
      });
    }).on("error", (err) => {
      console.error("Stream get error:", err);
      if (!res.headersSent) res.status(500).end();
    });
  };

  streamFromUrl(directUrl);
});

// 3. نقطة النهاية لرفع ملف الكوكيز لليوتيوب
app.post("/api/upload-cookies", upload.single("cookiesFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "لم يتم إرسال أي ملف." });
  }
  
  res.json({
    success: true,
    message: "تم رفع ملف الكوكيز لليوتيوب بنجاح."
  });
});

// 4. نقطة النهاية لرفع ملفات الكوكيز للمنصات الأخرى
app.post("/api/upload-cookies/:platform", upload.single("cookiesFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "لم يتم إرسال أي ملف." });
  }
  
  res.json({
    success: true,
    message: `تم رفع ملف الكوكيز للمنصة ${req.params.platform} بنجاح.`
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // معالج عام للأخطاء
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, error: "حدث خطأ غير متوقع في الخادم." });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    ensureYtDlp().catch(err => console.error("Failed to download yt-dlp initially:", err));
  });
}

startServer();
