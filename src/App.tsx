import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Link as LinkIcon, Loader2, AlertCircle, CheckCircle2, Globe, FileVideo, Music, Clock, User, Upload } from 'lucide-react';

type Language = 'ar' | 'en';

type VideoFormat = {
  format_id: string;
  ext: string;
  resolution: string;
  filesize: number;
  vcodec: boolean;
  acodec: boolean;
  format_note: string;
};

type VideoInfo = {
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  extractor: string;
  formats: VideoFormat[];
};

const translations = {
  ar: {
    title: 'محمّل الفيديوهات الشامل',
    subtitle: 'حمل فيديوهاتك المفضلة من يوتيوب، تيك توك، إنستغرام وأكثر من 20 منصة أخرى بضغطة زر.',
    placeholder: 'الصق رابط الفيديو هنا (مثال: https://youtu.be/...)',
    downloadBtn: 'تحميل الآن',
    processing: 'جاري المعالجة...',
    invalidUrl: 'الرجاء إدخال رابط صحيح يبدأ بـ http أو https.',
    networkError: 'حدث خطأ في الاتصال بالخادم.',
    success: 'تم جلب معلومات الفيديو بنجاح!',
    videoInfo: 'معلومات الفيديو',
    duration: 'المدة:',
    uploader: 'الناشر:',
    platform: 'المنصة:',
    downloadOptions: 'خيارات التحميل المتاحة',
    videoOnly: 'فيديو (بدون صوت)',
    audioOnly: 'صوت فقط',
    videoAudio: 'فيديو + صوت',
    downloadAction: 'تحميل',
    copyLink: 'نسخ الرابط',
    linkCopied: 'تم نسخ الرابط! افتحه في المتصفح للتحميل.',
    footer: 'يعمل مع أكثر من 20 منصة عالمية – بدون إعلانات – خصوصيتك محفوظة',
    switchLang: 'English',
    downloadingState: 'جاري التجهيز...',
    uploadCookies: 'رفع ملف cookies.txt (ليوتيوب)',
    uploadingCookies: 'جاري الرفع...',
    cookiesUploaded: 'تم رفع الكوكيز بنجاح!',
    cookiesFailed: 'فشل رفع ملف الكوكيز.'
  },
  en: {
    title: 'Universal Video Downloader',
    subtitle: 'Download your favorite videos from YouTube, TikTok, Instagram, and 20+ other platforms with one click.',
    placeholder: 'Paste video link here (e.g., https://youtu.be/...)',
    downloadBtn: 'Download Now',
    processing: 'Processing...',
    invalidUrl: 'Please enter a valid URL starting with http or https.',
    networkError: 'Network error occurred while contacting the server.',
    success: 'Video information retrieved successfully!',
    videoInfo: 'Video Information',
    duration: 'Duration:',
    uploader: 'Uploader:',
    platform: 'Platform:',
    downloadOptions: 'Available Download Options',
    videoOnly: 'Video (No Audio)',
    audioOnly: 'Audio Only',
    videoAudio: 'Video + Audio',
    downloadAction: 'Download',
    copyLink: 'Copy Link',
    linkCopied: 'Link copied! Open in browser to download.',
    footer: 'Works with 20+ global platforms – Ad-free – Privacy respected',
    switchLang: 'العربية',
    downloadingState: 'Preparing...',
    uploadCookies: 'Upload cookies.txt (for YouTube)',
    uploadingCookies: 'Uploading...',
    cookiesUploaded: 'Cookies uploaded successfully!',
    cookiesFailed: 'Failed to upload cookies.'
  }
};

function formatDuration(seconds: number) {
  if (!seconds) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [uploadingCookies, setUploadingCookies] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];
  const isAr = lang === 'ar';

  useEffect(() => {
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const handleProcessUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVideoInfo(null);
    setTaskId(null);
    setToast(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl || !trimmedUrl.startsWith('http')) {
      setError(t.invalidUrl);
      return;
    }

    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || t.networkError);
      } else {
        setVideoInfo(data.info);
        setTaskId(data.taskId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError(isAr ? 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.' : 'Request timed out. Please try again.');
      } else {
        setError(t.networkError);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: VideoFormat) => {
    if (!taskId) return;
    
    // التحميل عبر الخادم الوسيط
    const downloadUrl = `/api/download?taskId=${taskId}&formatId=${format.format_id}`;
    
    // إجبار المتصفح على التحميل
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = ''; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setToast(isAr ? 'بدأ التحميل...' : 'Download started...');
    setTimeout(() => setToast(null), 3000);
  };

  const handleUploadCookies = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCookies(true);
    const formData = new FormData();
    formData.append('cookiesFile', file);

    try {
      const res = await fetch('/api/upload-cookies', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setToast(t.cookiesUploaded);
      } else {
        setError(data.error || t.cookiesFailed);
      }
    } catch (err) {
      setError(t.cookiesFailed);
    } finally {
      setUploadingCookies(false);
      // مسح الملف المختار للسماح برفعه مرة أخرى إذا لزم الأمر
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setToast(null), 3000);
    }
  };

  const categorizeFormat = (f: VideoFormat) => {
    if (f.vcodec && f.acodec) return t.videoAudio;
    if (f.vcodec && !f.acodec) return t.videoOnly;
    if (!f.vcodec && f.acodec) return t.audioOnly;
    return 'Unknown';
  };

  return (
    <div className={`min-h-screen flex flex-col font-${isAr ? 'arabic' : 'inter'} bg-slate-900 text-slate-50 overflow-x-hidden relative`}>
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="w-full max-w-5xl mx-auto p-6 flex justify-end">
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 transition-colors text-sm font-medium"
        >
          <Globe className="w-4 h-4" />
          {t.switchLang}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg shadow-blue-500/20">
            <Download className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            {t.title}
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleProcessUrl}
          className="w-full max-w-2xl relative mb-8"
        >
          <div className="relative flex items-center shadow-2xl shadow-black/50 rounded-2xl">
            <div className={`absolute ${isAr ? 'right-4' : 'left-4'} text-slate-400 pointer-events-none`}>
              <LinkIcon className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.placeholder}
              className={`w-full bg-slate-800/80 border-2 border-slate-700 focus:border-blue-500 rounded-2xl py-5 ${isAr ? 'pr-14 pl-40' : 'pl-14 pr-40'} text-lg outline-none transition-all placeholder-slate-500`}
              disabled={loading}
              dir="ltr"
            />
            <div className={`absolute ${isAr ? 'left-2' : 'right-2'}`}>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">{t.processing}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span className="hidden sm:inline">{t.downloadBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Progress Bar (Visual only for the loading state) */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 w-full bg-slate-800 rounded-full h-2 overflow-hidden"
              >
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 15, ease: "easeOut" }} // Fake progress for perceived performance
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-2xl bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-start gap-3 mb-8"
            >
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Area */}
        <AnimatePresence>
          {videoInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-2xl"
            >
              {/* Thumbnail & Basic Info */}
              <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="relative rounded-2xl overflow-hidden aspect-video md:aspect-square shadow-lg bg-slate-900 border border-slate-700">
                  {videoInfo.thumbnail ? (
                    <img 
                      src={videoInfo.thumbnail} 
                      alt={videoInfo.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <FileVideo className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-md text-xs font-mono font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(videoInfo.duration)}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{videoInfo.uploader || 'غير معروف'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span className="capitalize">{videoInfo.extractor}</span>
                  </div>
                </div>
              </div>

              {/* Formats & Title */}
              <div className="w-full md:w-2/3 flex flex-col">
                <h2 className="text-xl md:text-2xl font-bold leading-tight mb-6 line-clamp-2" dir="auto">
                  {videoInfo.title}
                </h2>
                
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  {t.downloadOptions}
                </h3>
                
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {videoInfo.formats.length > 0 ? videoInfo.formats.map((format, idx) => (
                    <div key={idx} className="bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 rounded-xl p-3 flex items-center justify-between transition-colors group">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-blue-400 flex items-center gap-2" dir="ltr">
                          {format.resolution === 'صوت فقط' || !format.vcodec ? (
                            <Music className="w-4 h-4" />
                          ) : (
                            <FileVideo className="w-4 h-4" />
                          )}
                          {format.resolution === 'صوت فقط' ? (isAr ? 'صوت فقط' : 'Audio Only') : format.resolution}
                        </span>
                        <span className="text-xs text-slate-400 flex gap-2">
                          <span>{format.ext.toUpperCase()}</span>
                          {format.filesize ? (
                            <>
                              <span>•</span>
                              <span>{(format.filesize / (1024 * 1024)).toFixed(1)} MB</span>
                            </>
                          ) : null}
                          <span className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 border border-slate-700">
                            {categorizeFormat(format)}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(format)}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                          {t.downloadAction}
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center p-6 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      {isAr ? 'لا توجد صيغ متاحة للتحميل المباشر.' : 'No downloadable formats found.'}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Cookies Section */}
        <div className="mt-16 w-full max-w-xl mx-auto text-center">
          <input 
            type="file" 
            accept=".txt"
            ref={fileInputRef}
            onChange={handleUploadCookies}
            className="hidden"
            id="cookies-upload"
          />
          <label 
            htmlFor="cookies-upload" 
            className={`cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-slate-600 hover:border-blue-500 hover:bg-blue-500/10 transition-colors text-slate-300 hover:text-blue-400 ${uploadingCookies ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploadingCookies ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span className="font-medium text-sm">
              {uploadingCookies ? t.uploadingCookies : t.uploadCookies}
            </span>
          </label>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex flex-col items-center justify-center py-6 text-slate-500 text-sm mt-auto border-t border-slate-800 gap-4">
        <p>{t.footer}</p>
      </footer>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-6 left-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg shadow-green-500/20 flex items-center gap-2 z-50 font-medium"
          >
            <CheckCircle2 className="w-5 h-5" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
