import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, PictureInPicture } from 'lucide-react';
import { playSound } from '../utils/sounds';

interface VideoPlayerProps {
  sources?: string[];
  src?: string;
  poster: string;
  title: string;
}

export default function VideoPlayer({ sources, src, poster, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const actualSources = sources || (src ? [src] : []);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  useEffect(() => {
    setCurrentSourceIndex(0);
    setHasError(false);
    setIsLoading(true);
    setIsPlaying(false);
  }, [sources, src]);

  let hideControlsTimeout: any;

  const togglePlay = async () => {
    if (videoRef.current) {
      try {
        if (videoRef.current.paused) {
          await videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        playSound('click');
      } catch (e) {
        console.error("Playback error:", e);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = (val / 100) * videoRef.current.duration;
      setProgress(val);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const togglePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(() => setShowControls(false), 3000);
  };

  if (hasError) {
    return (
      <div className="w-full aspect-video bg-black rounded-2xl flex flex-col items-center justify-center overflow-hidden relative">
        <img src={poster} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="z-10 text-center p-4">
          <p className="text-white text-lg font-bold mb-2">عذراً، لا يمكن تشغيل هذا الفيديو مباشرة</p>
          <p className="text-slate-300 text-sm">يمكنك تحميل الفيديو باستخدام الأزرار بالأسفل.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={actualSources[currentSourceIndex]}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          if (currentSourceIndex < actualSources.length - 1) {
            setCurrentSourceIndex(prev => prev + 1);
            setIsLoading(true);
          } else {
            setIsLoading(false);
            setHasError(true);
          }
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onCanPlay={() => setIsLoading(false)}
        playsInline
        preload="auto"
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {!isPlaying && !isLoading && (
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg pointer-events-auto cursor-pointer hover:bg-white/30 transition-colors" onClick={togglePlay}>
            <Play className="w-8 h-8 ml-1" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'} flex flex-col gap-2`}>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all"
        />
        <div className="flex items-center justify-between text-white mt-1">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-blue-400 transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={toggleMute} className="hover:text-blue-400 transition-colors">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center gap-4">
            {document.pictureInPictureEnabled && (
              <button onClick={togglePiP} className="hover:text-blue-400 transition-colors">
                <PictureInPicture className="w-5 h-5" />
              </button>
            )}
            <button onClick={toggleFullscreen} className="hover:text-blue-400 transition-colors">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
