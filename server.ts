import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import https from "https";
import http from "http";
import crypto from "crypto";
import { execFile, spawn } from "child_process";
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
    const saveAndRespond = (info: any, fullFormats: any[], cookiePath: string | null = null) => {
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
        originalUrl: url,
        cookiePath: cookiePath
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
        
        // سبب تجاهل الصيغ التي لا تحتوي على رابط مباشر: لضمان تقديم خيارات للمستخدم قابلة للتحميل فعلياً
        // تم التعديل لدعم جميع الجودات حتى 8K (4320p) لملفات mp4 و webm
        const fullFormats = data.formats
          .filter((f: any) => 
            f.url && 
            f.url.trim() !== '' && 
            f.url.startsWith('http') && 
            ['mp4', 'webm', 'm4a', 'mp3'].includes(f.ext) && 
            (f.vcodec !== 'none' || f.acodec !== 'none')
          )
          .reverse();

        if (fullFormats.length === 0) {
            throw new Error("NO_VALID_FORMATS");
        }

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
            
            let stdout;
            try {
                stdout = await runYtDlp(cleanUrl, extraArgs);
            } catch (err: any) {
                if (err.stderr && err.stderr.includes('Requested format is not available')) {
                    console.log("Retrying YouTube extraction without player_client=ios fallback...");
                    const fallbackArgs = [
                       "--cookies", selectedCookiePath,
                       "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                       "--js-runtimes", `node:${process.execPath}`
                    ];
                    stdout = await runYtDlp(cleanUrl, fallbackArgs);
                } else {
                    throw err;
                }
            }
            
            const { info, fullFormats } = processYtDlpOutput(stdout);
            
            // تخزين النتائج في الذاكرة (Cache) وأعد البيانات
            return saveAndRespond(info, fullFormats, selectedCookiePath);
            
        } catch (e: any) {
            console.error("YouTube Error:", e);
            if (e.message === "NO_VALID_FORMATS") {
                return res.status(400).json({ success: false, error: "لا توجد صيغ قابلة للتحميل لهذا الفيديو." });
            }
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
         if (e.message === "NO_VALID_FORMATS") {
             return res.status(400).json({ success: false, error: "لا توجد صيغ قابلة للتحميل لهذا الفيديو." });
         }
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
                     return saveAndRespond(info, fullFormats, selectedCookiePath);
                 } catch (retryError: any) {
                     if (retryError.message === "NO_VALID_FORMATS") {
                         return res.status(400).json({ success: false, error: "لا توجد صيغ قابلة للتحميل لهذا الفيديو." });
                     }
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
app.get("/api/download", async (req, res, next) => {
  try {
    const { taskId, formatId } = req.query;
    
    if (!taskId || !formatId) {
      return res.status(400).json({ success: false, error: "معلمات غير صالحة" });
    }

    const cachedData = cache.get(taskId as string);
    if (!cachedData) {
      return res.status(404).json({ success: false, error: "انتهت صلاحية الجلسة. يرجى تحليل الرابط مرة أخرى." });
    }

    // استخراج البيانات من الكاش
    const originalUrl = cachedData.originalUrl;
    const cookiePath = cachedData.cookiePath;
    
    // تنظيف اسم الملف من الرموز الخاصة لتجنب الأخطاء
    const cleanTitle = cachedData.info.title.replace(/[^\w\s\u0600-\u06FF-]/gi, '').trim().replace(/\s+/g, '_');
    const format = cachedData.info.formats.find((f: any) => f.format_id === formatId);
    let fileName = `${cleanTitle}.${format?.ext || 'mp4'}`;

    // دالة بث الفيديو مباشرة
    const streamVideo = (requestedFormatId: string, isFallback: boolean = false, retryCount: number = 0) => {
        // لماذا تم الاستغناء عن الروابط المباشرة المخزنة:
        // لأن الروابط قد تنتهي صلاحيتها أو تصبح غير صالحة، مما يسبب خطأ Requested format is not available
        // بينما استخدام yt-dlp في وقت الطلب يضمن استخراج رابط حي.
        
        // لماذا تم استخدام spawn بدلاً من exec:
        // لتمكين بث الفيديو (Streaming) مباشرة للمستخدم دون تحميله وتخزينه في ذاكرة الخادم أولاً.
        const args = [
            "--no-playlist",
            "--no-check-certificate",
            "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "-f", requestedFormatId,
            "-o", "-" // توجيه الخرج إلى stdout
        ];

        if (cookiePath && fs.existsSync(cookiePath)) {
            args.push("--cookies", cookiePath);
        }

        args.push(originalUrl);

        let hasData = false;
        const ytDlpProcess = spawn(YTDLP_PATH, args);

        // إعداد رؤوس الاستجابة إذا لم يتم إرسالها بعد
        if (!res.headersSent) {
            res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
            res.setHeader("Content-Type", format?.ext === 'mp3' || format?.ext === 'm4a' ? "audio/mpeg" : (format?.ext === 'webm' ? "video/webm" : "video/mp4"));
            if (isFallback) {
                res.setHeader("X-Format-Fallback", "true");
            }
        }

        ytDlpProcess.stdout.on('data', () => {
            hasData = true;
        });

        // كيفية بث الفيديو مباشرة إلى المستخدم: عن طريق توجيه stdout الخاص بـ child_process إلى كائن الاستجابة (res)
        ytDlpProcess.stdout.pipe(res);
        
        let stderrData = '';
        ytDlpProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        ytDlpProcess.on('close', (code) => {
            if (code !== 0 && !res.writableEnded) {
                console.error(`yt-dlp closed with code ${code}. Stderr: ${stderrData}`);
                
                if (!hasData) {
                    // كيفية إعادة المحاولة تلقائياً: إذا لم نستلم بيانات، نعيد نفس الصيغة مرة واحدة
                    if (retryCount === 0 && !isFallback) {
                        console.log("Retrying current format once...");
                        streamVideo(requestedFormatId, false, 1);
                    } 
                    // كيفية عمل الخطة الاحتياطية باستخدام "-f best":
                    // سبب أن هذه الطريقة تمنع انتهاء صلاحية الروابط وتحل مشكلة Requested format is not available:
                    // لأننا نتخلى عن الصيغة المطلوبة التي قد لا تكون متاحة ونطلب من yt-dlp جلب أفضل جودة متوفرة الآن
                    else if (!isFallback) {
                        console.log("Retrying with fallback format (-f best)...");
                        streamVideo("best", true, 0);
                    } else if (!res.headersSent) {
                        res.status(500).json({ success: false, error: "تعذر تحميل الفيديو من المصدر. يرجى المحاولة لاحقاً." });
                    } else {
                        res.end();
                    }
                }
            } else if (!hasData && !res.writableEnded) {
                if (!isFallback) {
                     console.log("No data received. Retrying with fallback format (-f best)...");
                     streamVideo("best", true, 0);
                 } else if (!res.headersSent) {
                     res.status(500).json({ success: false, error: "فشل بث الفيديو بعد كل المحاولات." });
                 } else {
                     res.end();
                 }
            }
        });
        
        ytDlpProcess.on('error', (err) => {
            console.error("Spawn error:", err);
            if (!hasData && !isFallback && !res.writableEnded) {
                streamVideo("best", true, 0);
            } else if (!res.headersSent) {
                res.status(500).json({ success: false, error: "حدث خطأ أثناء تشغيل أداة التحميل." });
            } else {
                res.end();
            }
        });
        
        req.on('close', () => {
            if (!ytDlpProcess.killed) {
                ytDlpProcess.kill();
            }
        });
    };

    streamVideo(formatId as string);

  } catch (err) {
    console.error("Download endpoint error:", err);
    if (!res.headersSent) {
       res.status(500).json({ success: false, error: "حدث خطأ غير متوقع أثناء عملية التحميل." });
    }
  }
});

// 3. نقطة النهاية لمعاينة الفيديو المباشر
app.get("/api/stream", async (req, res) => {
  const { taskId, formatId } = req.query;
  
  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ success: false, error: "Missing taskId" });
  }

  const cachedData = cache.get(taskId);
  if (!cachedData) {
    return res.status(404).json({ success: false, error: "انتهت صلاحية الجلسة، يرجى المحاولة مرة أخرى." });
  }

  const originalUrl = cachedData.originalUrl;
  const cookiePath = cachedData.cookiePath;
  let targetFormat = formatId as string;
  
  if (!targetFormat) {
     // اختيار جودة مناسبة للمعاينة (أفضل جودة mp4 لا تتجاوز 1080p مع صوت وفيديو)
     const previewFormats = cachedData.info.formats.filter((f: any) => 
        f.ext === 'mp4' && 
        f.vcodec !== 'none' && 
        f.acodec !== 'none' && 
        (f.resolution && !f.resolution.includes('صوت') ? parseInt(f.resolution) <= 1080 : true)
     );
     
     if (previewFormats.length > 0) {
       targetFormat = previewFormats[0].format_id;
     } else {
       targetFormat = "best[ext=mp4]/best";
     }
  }

  const streamVideo = (requestedFormatId: string, isFallback: boolean = false, retryCount: number = 0) => {
    let cmdArgs = ["-f", requestedFormatId, "-g", "--no-warnings"];
    if (cookiePath) cmdArgs.push("--cookies", cookiePath);
    cmdArgs.push("--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    if (originalUrl.includes("youtube.com") || originalUrl.includes("youtu.be")) {
      cmdArgs.push("--js-runtimes", `node:${process.execPath}`, "--extractor-args", "youtube:player_client=ios");
    }
    cmdArgs.push(originalUrl);

    execFile(YTDLP_PATH, cmdArgs, { timeout: 30000 }, (error, stdout, stderr) => {
       if (error) {
           if (retryCount === 0 && !isFallback) {
              return streamVideo(requestedFormatId, false, 1);
           } else if (!isFallback) {
              return streamVideo("best[ext=mp4]/best", true, 0);
           } else {
              return res.status(500).json({ success: false, error: "فشل استخراج رابط المعاينة" });
           }
       }
       
       const streamUrl = stdout.trim().split('\n')[0];
       if (!streamUrl) {
           return res.status(500).json({ success: false, error: "لم يتم العثور على رابط مباشر" });
       }
       
       const range = req.headers.range;
       const headers: any = {
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
       };
       if (range) {
           headers['Range'] = range;
       }
       
       fetch(streamUrl, { headers }).then(fetchRes => {
           if (!fetchRes.ok && fetchRes.status !== 206) {
               throw new Error("Failed to fetch stream");
           }
           
           if (fetchRes.status === 206 || fetchRes.status === 200) {
               res.status(fetchRes.status);
               ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(header => {
                   if (fetchRes.headers.has(header)) {
                       res.setHeader(header, fetchRes.headers.get(header)!);
                   }
               });
               res.setHeader('Cache-Control', 'no-cache');
               if (!fetchRes.headers.has('content-type')) {
                   res.setHeader('Content-Type', 'video/mp4');
               }
           } else {
               res.setHeader('Content-Type', 'video/mp4');
               res.setHeader('Accept-Ranges', 'bytes');
               res.setHeader('Cache-Control', 'no-cache');
           }
           
           if (fetchRes.body) {
               const { Readable } = require('stream');
               Readable.fromWeb(fetchRes.body as any).pipe(res);
           } else {
               res.end();
           }
       }).catch(err => {
           console.error("Stream fetch error:", err);
           if (!res.headersSent) {
               res.status(500).json({ success: false, error: "تعذر بث الفيديو" });
           }
       });
    });
  };
  
  streamVideo(targetFormat);
});

// 4. نقطة النهاية لرفع ملف الكوكيز لليوتيوب
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
