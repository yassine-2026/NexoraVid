import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Play, Music, Copy, Share2, Check, ExternalLink, Loader2, Video } from 'lucide-react';
import { playSound } from '../utils/sounds';

interface ResultCardProps {
  key?: React.Key;
  videoInfo: any;
  translations: any;
  onDownload: (formatId: string, isAudio: boolean) => void | Promise<void>;
  onConvertGif: (formatId: string) => void;
  downloadingState: { formatId: string | null; isDownloading: boolean; isGif: boolean };
}

export default function ResultCard({ videoInfo, translations: t, onDownload, onConvertGif, downloadingState }: ResultCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showFormats, setShowFormats] = useState(false); // Mobile optimization

  // Filter video & audio formats
  const videoFormats = videoInfo.formats.filter((f: any) => f.vcodec && !f.resolution?.includes('صوت'));
  const audioFormats = videoInfo.formats.filter((f: any) => f.resolution?.includes('صوت') || (!f.vcodec && f.acodec));

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
      className="w-full mt-12 bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row gap-8 relative z-10">
        {/* Thumbnail & Preview section */}
        <div className="w-full lg:w-5/12 flex flex-col gap-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg group/thumb cursor-pointer perspective-1000">
            {!showPreview ? (
              <motion.div 
                whileHover={{ rotateY: 5, rotateX: 5, scale: 1.05 }}
                className="w-full h-full transform-style-3d transition-all duration-500"
                onClick={() => { playSound('click'); setShowPreview(true); }}
              >
                <img src={videoInfo.thumbnail} alt={videoInfo.title} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg border border-white/30 transform group-hover/thumb:scale-110 transition-transform">
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="w-full h-full bg-black rounded-2xl overflow-hidden relative">
                {videoInfo.extractor === 'youtube' ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=1`}
                    className="w-full h-full absolute inset-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                  />
                ) : (
                  <video src={videoFormats[0]?.url} controls autoPlay className="w-full h-full absolute inset-0 object-contain" />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 bg-white/5 dark:bg-black/20 p-3 rounded-xl border border-white/10">
            <button onClick={handleCopyLink} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
              {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? t.linkCopied : t.copyLinkBtn}
            </button>
            <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
              {copiedShare ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
              Share
            </button>
          </div>
        </div>

        {/* Details & Downloads section */}
        <div className="w-full lg:w-7/12 flex flex-col">
          <h3 className="text-xl md:text-2xl font-bold mb-2 line-clamp-2">{videoInfo.title}</h3>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-6">
             <span className="flex items-center gap-1"><Video className="w-4 h-4" /> {videoInfo.platform || videoInfo.extractor}</span>
             <span className="flex items-center gap-1">• {videoInfo.duration}</span>
             <span className="flex items-center gap-1">• {videoInfo.uploader}</span>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            {/* Video Formats */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-500 dark:text-blue-400">
                <Video className="w-4 h-4" /> Video Qualities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {videoFormats.map((format: any) => (
                   <div key={format.format_id} className="flex flex-col bg-white/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden hover:border-blue-400/50 transition-colors group/pill">
                      <div className="p-3 flex items-center justify-between">
                         <div className="flex flex-col">
                           <span className="font-bold text-lg">{format.resolution}</span>
                           <span className="text-xs text-slate-500 dark:text-slate-400">{format.ext.toUpperCase()} • {formatFileSize(format.filesize)}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <button 
                             onClick={() => { playSound('click'); onConvertGif(format.format_id); }}
                             disabled={downloadingState.isDownloading}
                             className="px-2 py-1.5 text-xs font-medium rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors"
                             title="Convert to GIF (first 10s)"
                           >
                             GIF
                           </button>
                           <button 
                             onClick={() => { playSound('click'); onDownload(format.format_id, false); }}
                             disabled={downloadingState.isDownloading}
                             className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg hover:bg-blue-500 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                           >
                             {downloadingState.isDownloading && downloadingState.formatId === format.format_id && !downloadingState.isGif ? (
                               <Loader2 className="w-5 h-5 animate-spin" />
                             ) : <Download className="w-5 h-5" />}
                           </button>
                         </div>
                      </div>
                   </div>
                ))}
              </div>
            </div>

            {/* Audio Formats */}
            {audioFormats.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-500 dark:text-green-400">
                  <Music className="w-4 h-4" /> Audio Only
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  {audioFormats.map((format: any) => (
                    <div key={format.format_id} className="flex items-center justify-between p-3 bg-white/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-green-400/50 transition-colors">
                       <div className="flex flex-col">
                         <span className="font-bold text-sm">Audio Quality</span>
                         <span className="text-xs text-slate-500 dark:text-slate-400">{format.ext.toUpperCase()} • {formatFileSize(format.filesize)}</span>
                       </div>
                       <button 
                         onClick={() => { playSound('click'); onDownload(format.format_id, true); }}
                         disabled={downloadingState.isDownloading}
                         className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors font-medium text-sm flex items-center gap-2"
                       >
                         {downloadingState.isDownloading && downloadingState.formatId === format.format_id ? (
                           <Loader2 className="w-4 h-4 animate-spin" />
                         ) : <Download className="w-4 h-4" />}
                         {t.downloadAction}
                       </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
