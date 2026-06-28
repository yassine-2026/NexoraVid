import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import https from "https";
import http from "http";
import crypto from "crypto";
import { execFile } from "child_process";
import { createServer as createViteServer } from "vite";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// تفعيل إضافة التخفي لتجاوز حماية يوتيوب (Stealth Mode)
puppeteer.use(StealthPlugin());

const app = express();
const PORT = parseInt(process.env.PORT as string, 10) || 3000;
const YTDLP_PATH = path.resolve(process.cwd(), 'yt-dlp');

app.use(express.json());
// تفعيل CORS للسماح بالطلبات من أي نطاق
app.use(cors({ origin: '*' }));

let downloadPromise: Promise<boolean> | null = null;

// ذاكرة التخزين المؤقت (In-Memory Cache)
// لتخزين نتائج التحليل مع taskId
const cache = new Map<string, any>();

// دالة لتنظيف الذاكرة المؤقتة كل 10 دقائق لمنع تسرب الذاكرة
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) {
      cache.delete(key);
    }
  }
}, 60 * 1000);

// دالة مساعدة لتحميل ملف التشغيل الخاص بـ yt-dlp في حال لم يكن موجوداً
async function ensureYtDlp() {
  if (fs.existsSync(YTDLP_PATH)) {
    const stats = fs.statSync(YTDLP_PATH);
    if (stats.size > 1000000) { // Should be ~30MB
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
        resolve(true);
      }
    });
  });

  return downloadPromise;
}

// دالة لتحويل كوكيز Puppeteer إلى صيغة Netscape (لكي يفهمها yt-dlp)
function formatCookiesToNetscape(cookies: any[]) {
  let out = "# Netscape HTTP Cookie File\n# https://curl.haxx.se/rfc/cookie_spec.html\n# This is a generated file!  Do not edit.\n\n";
  for (const cookie of cookies) {
    const domain = cookie.domain || '';
    const domainFlag = domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const path = cookie.path || '/';
    const secure = cookie.secure ? 'TRUE' : 'FALSE';
    // نعالج قيمة expires بحيث تكون صحيحة لصيغة Netscape
    const expires = cookie.expires && cookie.expires !== -1 ? Math.floor(cookie.expires) : 0;
    const name = cookie.name;
    const value = cookie.value;
    out += `${domain}\t${domainFlag}\t${path}\t${secure}\t${expires}\t${name}\t${value}\n`;
  }
  return out;
}

// 1. نقطة النهاية لتحليل الرابط واستخراج البيانات
app.post("/api/analyze", async (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ success: false, error: "رابط غير صالح" });
  }

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  try {
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
      res.json({ success: true, taskId, info: safeInfo });
    };

    const runYtDlp = (targetUrl: string, timeout = 30000, extraArgs: string[] = []): Promise<any> => {
      return new Promise((resolve, reject) => {
        const cmdArgs = [
          "--dump-json",
          "--no-playlist",
          "--no-check-certificate",
          "--no-warnings"
        ];
        
        cmdArgs.push(...extraArgs);
        cmdArgs.push(targetUrl);
        
        execFile(YTDLP_PATH, cmdArgs, { maxBuffer: 1024 * 1024 * 10, timeout }, (error, stdout, stderr) => {
           if (error) reject({ error, stderr });
           else resolve(stdout);
        });
      });
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
        // تنفيذ خطوات يوتيوب عبر Puppeteer + yt-dlp
        let cookieFilePath = '';
        try {
            console.log("Analyzing YouTube Video with Puppeteer + yt-dlp...");
            
            // 1. شغل متصفح Chromium خفي باستخدام Puppeteer
            const browser = await puppeteer.launch({ 
                headless: 'new', // يعمل بشكل خفي
                args: [
                  '--no-sandbox', 
                  '--disable-setuid-sandbox',
                  '--disable-dev-shm-usage',
                  '--disable-accelerated-2d-canvas',
                  '--disable-gpu'
                ] // إعدادات مهمة لتجنب الأخطاء على سيرفرات مثل Render
            });
            let cookies: any[] = [];
            let userAgent = '';
            
            try {
                const page = await browser.newPage();
                
                // 2. افتح صفحة الفيديو
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                
                // 3. انتظر حوالي 5 ثواني حتى يكتمل تحميل الصفحة
                await new Promise(r => setTimeout(r, 5000));
                
                // 4. إذا ظهرت نافذة الكوكيز وفيها زر: Accept all اضغط عليه تلقائياً
                try {
                   await page.evaluate(() => {
                       const btns = Array.from(document.querySelectorAll('button, span'));
                       const acceptBtn = btns.find(b => {
                           const text = (b.textContent || '').toLowerCase();
                           return text.includes('accept all') || text.includes('agree') || text.includes('قبول');
                       });
                       if (acceptBtn) { 
                           (acceptBtn as HTMLElement).click(); 
                       }
                   });
                   // ننتظر قليلاً بعد الضغط في حال تغيير الكوكيز
                   await new Promise(r => setTimeout(r, 2000));
                } catch (e) {}
                
                // 5. استخراج جميع الكوكيز
                cookies = await page.cookies();
                userAgent = await browser.userAgent();
            } finally {
                // 6. أغلق المتصفح مباشرة ولا تترك عمليات تعمل في الخلفية
                await browser.close();
            }
            
            // 7. حول الكوكيز إلى صيغة Netscape
            const netscapeCookies = formatCookiesToNetscape(cookies);
            
            // 8. احفظها داخل مجلد temp (مثلاً temp/cookies-youtube-{id}.txt)
            const tempDir = path.resolve(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
            
            const uuid = crypto.randomUUID();
            cookieFilePath = path.join(tempDir, `cookies-youtube-${uuid}.txt`);
            fs.writeFileSync(cookieFilePath, netscapeCookies);
            
            // تنظيف الرابط من معلمات التتبع
            const cleanUrl = url.split('&')[0];
            
            // 9. شغّل yt-dlp مع ملف الكوكيز المؤقت
            const extraArgs = [
               "--cookies", cookieFilePath,
               "--user-agent", userAgent,
               "--js-runtimes", `node:${process.execPath}`
            ];
            
            const stdout = await runYtDlp(cleanUrl, 30000, extraArgs);
            const { info, fullFormats } = processYtDlpOutput(stdout);
            
            // 10. بعد انتهاء yt-dlp احذف ملف الكوكيز المؤقت
            if (fs.existsSync(cookieFilePath)) {
               fs.unlinkSync(cookieFilePath);
            }
            
            // 11. خزن النتائج في الذاكرة (Cache) وأعد البيانات
            return saveAndRespond(info, fullFormats);
            
        } catch (e: any) {
            // حذف ملف الكوكيز في حال حدث خطأ
            if (cookieFilePath && fs.existsSync(cookieFilePath)) {
                fs.unlinkSync(cookieFilePath);
            }
            console.error("YouTube Error:", e);
            let errorMessage = "تعذر استخراج البيانات من اليوتيوب. تأكد من أن الفيديو عام وغير محذوف.";
            if (e.stderr) {
                const match = e.stderr.match(/ERROR: (.*)/);
                if (match) errorMessage = `خطأ من يوتيوب: ${match[1]}`;
            }
            return res.status(400).json({ success: false, error: errorMessage });
        }
    } else {
       // تشغيل المنصات الأخرى بشكل اعتيادي
       try {
         const extraArgs = [
           "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
         ];
         const stdout = await runYtDlp(url, 30000, extraArgs);
         const { info, fullFormats } = processYtDlpOutput(stdout);
         return saveAndRespond(info, fullFormats);
       } catch (e: any) {
         let errorMessage = "تعذر استخراج البيانات من الرابط. قد يكون غير مدعوم أو خاص.";
         if (e.stderr) {
            const match = e.stderr.match(/ERROR: (.*)/);
            if (match) errorMessage = `خطأ من الخادم: ${match[1]}`;
         }
         if (e.error && e.error.killed) errorMessage = "انتهت مهلة التحليل. يرجى المحاولة مرة أخرى.";
         return res.status(400).json({ success: false, error: errorMessage });
       }
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ success: false, error: "حدث خطأ في الخادم أثناء محاولة معالجة الرابط." });
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

  // تعيين رؤوس الإجبار على التحميل
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    ensureYtDlp().catch(err => console.error("Failed to download yt-dlp initially:", err));
  });
}

startServer();
