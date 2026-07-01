import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Play, Music, Copy, Share2, Check, ExternalLink, Loader2, Video, Calendar, Eye, User, FileVideo, HardDrive, Zap, X } from 'lucide-react';
import { playSound } from '../utils/sounds';
import VideoPlayer from './VideoPlayer';

interface ResultCardProps {
  key?: React.Key;
  taskId: string;
  videoInfo: any;
  translations: any;
}

export default function ResultCard({ taskId, videoInfo, translations: t }: ResultCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [activeModal, setActiveModal] = useState<'video' | 'audio' | null>(null);
  const [speed, setSpeed] = useState<string>('N/A');

  useEffect(() => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      setSpeed(conn.downlink ? `${conn.downlink} Mbps` : 'N/A');
    }
  }, []);

  const handleCopyLink = () => {
    playSound('click');
    navigator.clipboard.writeText(videoInfo.originalUrl || window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = () => {
    playSound('click');
    const text = `Check out this video: ${videoInfo.title}\nOriginal Link: ${videoInfo.originalUrl}\nDownloaded via NexoraVid`;
    if (navigator.share) {
      navigator.share({ title: videoInfo.title, text, url: window.location.href }).catch(() => {
        navigator.clipboard.writeText(text);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      });
    } else {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Organize formats based on the requirement
  const videoFormats = videoInfo.formats.filter((f: any) => f.vcodec && f.vcodec !== 'none' && !f.resolution?.includes('صوت'));
  const audioFormats = videoInfo.formats.filter((f: any) => f.resolution?.includes('صوت') || (!f.vcodec || f.vcodec === 'none') && f.acodec && f.acodec !== 'none');

  // Group and sort video formats
  const desiredResolutions = ['4320p', '2160p', '1080p', '720p', '480p'];
  const processedVideoFormats = desiredResolutions.map(res => {
    // find best format for this resolution
    const format = videoFormats.find((f: any) => f.format_note === res || f.resolution?.includes(res.replace('p', '')));
    return { resolution: res, format };
  }).filter(item => item.format); // Only keep available

  const bestAudioFormats = ['mp3', 'm4a', 'opus'].map(ext => {
    const formats = audioFormats.filter((f: any) => f.ext === ext);
    if (formats.length === 0) return null;
    // get highest bitrate
    return formats.sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];
  }).filter(Boolean);

  const bestVideoFormat = videoFormats[0];

  // find best progressive format
  const progressiveFormats = videoInfo.formats.filter((f: any) => 
    f.vcodec && f.vcodec !== 'none' && 
    f.acodec && f.acodec !== 'none' && 
    f.ext === 'mp4' &&
    f.url
  ).sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

  const streamUrls = useMemo(() => [
    ...progressiveFormats.map((f: any) => f.url),
    `/api/stream?taskId=${taskId}` // Ultimate fallback
  ], [taskId, videoInfo.formats]);

  const renderModal = () => {
    if (!activeModal) return null;

    const isVideo = activeModal === 'video';
    const items = isVideo ? processedVideoFormats : bestAudioFormats;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              {isVideo ? <Video className="w-6 h-6 text-blue-400" /> : <Music className="w-6 h-6 text-green-400" />}
              {isVideo ? 'Download Video Quality' : 'Download Audio Quality'}
            </h3>
            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {isVideo ? processedVideoFormats.map((item: any, idx) => {
              const { resolution, format } = item;
              
              return (
                <div key={idx} className="bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl font-black text-white">{resolution}</span>
                      {resolution === '1080p' && <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded font-bold">Full HD</span>}
                      {resolution === '720p' && <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded font-bold">HD</span>}
                      {(resolution === '2160p' || resolution === '4320p') && <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded font-bold">{resolution === '2160p' ? '4K' : '8K'}</span>}
                      {typeof format.vcodec === 'string' && format.vcodec.includes('hdr') && <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded font-bold">HDR</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                      <span>{format.ext.toUpperCase()}</span>
                      {typeof format.vcodec === 'string' && <span>{format.vcodec.split('.')[0]}</span>}
                      {format.fps && <span>{format.fps} FPS</span>}
                      {format.tbr && <span>{Math.round(format.tbr)} kbps</span>}
                      <span className="text-slate-300 font-medium">{formatFileSize(format.filesize)}</span>
                    </div>
                  </div>
                  <a
                    href={`/api/download?taskId=${taskId}&formatId=${format.format_id}`}
                    download={`${(videoInfo?.title || 'video').replace(/[^\w\s\u0600-\u06FF-]/gi, '').trim().replace(/\s+/g, '_')}_${resolution || 'video'}.${format.ext || 'mp4'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { 
                      playSound('click'); 
                      setActiveModal(null); 
                      // عرض مؤشر بصري بسيط بأن التحميل بدأ بدون التأثير على آلية تنزيل المتصفح
                      if (document.body) {
                        const progressContainer = document.createElement('div');
                        progressContainer.className = 'fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5';
                        progressContainer.innerHTML = '<div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div><span class="font-medium">جاري بدء التحميل...</span>';
                        document.body.appendChild(progressContainer);
                        setTimeout(() => {
                          if (document.body.contains(progressContainer)) {
                            progressContainer.style.opacity = '0';
                            progressContainer.style.transition = 'opacity 0.3s ease';
                            setTimeout(() => document.body.removeChild(progressContainer), 300);
                          }
                        }, 1500);
                      }
                    }}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-2`}
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </a>
                </div>
              );
            }) : bestAudioFormats.map((format: any, idx) => {
              
              return (
                <div key={idx} className="bg-slate-800/50 border border-slate-700 hover:border-green-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl font-black text-white">{format.ext.toUpperCase()}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                      {format.abr && <span>{Math.round(format.abr)} kbps</span>}
                      {typeof format.acodec === 'string' && <span>{format.acodec.split('.')[0]}</span>}
                      <span className="text-slate-300 font-medium">{formatFileSize(format.filesize)}</span>
                    </div>
                  </div>
                  <a
                    href={`/api/download?taskId=${taskId}&formatId=${format.format_id}`}
                    download={`${(videoInfo?.title || 'audio').replace(/[^\w\s\u0600-\u06FF-]/gi, '').trim().replace(/\s+/g, '_')}_audio.${format.ext || 'mp3'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { 
                      playSound('click'); 
                      setActiveModal(null); 
                      // عرض مؤشر بصري بسيط بأن التحميل بدأ بدون التأثير على آلية تنزيل المتصفح
                      if (document.body) {
                        const progressContainer = document.createElement('div');
                        progressContainer.className = 'fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5';
                        progressContainer.innerHTML = '<div class="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div><span class="font-medium">جاري بدء التحميل...</span>';
                        document.body.appendChild(progressContainer);
                        setTimeout(() => {
                          if (document.body.contains(progressContainer)) {
                            progressContainer.style.opacity = '0';
                            progressContainer.style.transition = 'opacity 0.3s ease';
                            setTimeout(() => document.body.removeChild(progressContainer), 300);
                          }
                        }, 1500);
                      }
                    }}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all flex items-center justify-center gap-2`}
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </a>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
      className="w-full mt-12 bg-white/10 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
    >
      <div className="flex flex-col lg:flex-row">
        {/* Left Side: Player */}
        <div className="w-full lg:w-7/12 bg-black relative">
           <VideoPlayer sources={streamUrls} poster={videoInfo.thumbnail} title={videoInfo.title} />
        </div>

        {/* Right Side: Details & Actions */}
        <div className="w-full lg:w-5/12 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white line-clamp-2 mb-4 leading-tight">{videoInfo.title}</h2>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-slate-600 dark:text-slate-300 mb-6">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-500" />
                <span className="truncate">{videoInfo.platform || videoInfo.extractor || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500" />
                <span className="truncate">{videoInfo.uploader || 'Unknown'}</span>
              </div>
              {videoInfo.duration && (
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-green-500" />
                  <span>{videoInfo.duration}</span>
                </div>
              )}
              {videoInfo.view_count && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-500" />
                  <span>{new Intl.NumberFormat().format(videoInfo.view_count)} Views</span>
                </div>
              )}
              {videoInfo.upload_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span>{videoInfo.upload_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>{speed} Speed</span>
              </div>
            </div>

            <div className="bg-white/5 dark:bg-white/5 rounded-2xl p-4 flex items-center justify-between mb-8 border border-white/10">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Original Quality</span>
                <span className="font-bold text-white flex items-center gap-2"><FileVideo className="w-4 h-4" /> {bestVideoFormat?.resolution || 'Unknown'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">File Type</span>
                <span className="font-bold text-white">{bestVideoFormat?.ext?.toUpperCase() || 'MP4'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Est. Size</span>
                <span className="font-bold text-white flex items-center gap-2"><HardDrive className="w-4 h-4" /> {formatFileSize(bestVideoFormat?.filesize)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <button 
              onClick={() => { playSound('click'); setActiveModal('video'); }}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-3"
            >
              <Download className="w-6 h-6" /> Download Video (Audio + Video)
            </button>
            <button 
              onClick={() => { playSound('click'); setActiveModal('audio'); }}
              className="w-full py-4 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold text-lg transition-all flex items-center justify-center gap-3"
            >
              <Music className="w-6 h-6 text-green-500" /> Download Audio Only
            </button>
            
            <div className="flex items-center gap-3 mt-3">
              <button onClick={handleCopyLink} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-300 flex items-center justify-center gap-2 transition-colors">
                {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />} {t.copyLinkBtn}
              </button>
              <button onClick={handleShare} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-300 flex items-center justify-center gap-2 transition-colors">
                {copiedShare ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />} Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {renderModal()}
      </AnimatePresence>
    </motion.div>
  );
}

