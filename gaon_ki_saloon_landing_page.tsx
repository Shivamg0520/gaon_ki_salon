import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Headphones, Music2, Clock, Volume2, VolumeX, Youtube } from 'lucide-react';
import bgImage from './salon_bg.webp';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [songProgress, setSongProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isYtReady, setIsYtReady] = useState(false);

  // Active track info from YouTube Playlist
  const [trackTitle, setTrackTitle] = useState('Gaon Ki Saloon Playlist');
  const [trackArtist, setTrackArtist] = useState('Village Soundscapes');
  const [trackThumbnail, setTrackThumbnail] = useState('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1000&auto=format&fit=crop');

  // User's exact YouTube Music Playlist ID
  const playlistId = 'PLQSN0EC5GK3TSTXo6cz3CO6j0RfKUS6Mb';
  const ytPlayerRef = useRef<any>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Load YouTube IFrame API Script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initYouTubePlayer();
    };

    if (window.YT && window.YT.Player) {
      initYouTubePlayer();
    }
  }, []);

  const initYouTubePlayer = () => {
    if (ytPlayerRef.current) return;

    ytPlayerRef.current = new window.YT.Player('yt-player-hidden-element', {
      height: '0',
      width: '0',
      playerVars: {
        listType: 'playlist',
        list: playlistId,
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: (e: any) => {
          setIsYtReady(true);
          updateTrackInfo();
        },
        onStateChange: (event: any) => {
          // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
          if (event.data === 1) {
            setIsPlaying(true);
            updateTrackInfo();
          } else if (event.data === 2) {
            setIsPlaying(false);
          } else if (event.data === 0) {
            updateTrackInfo();
          }
        }
      }
    });
  };

  const updateTrackInfo = () => {
    if (!ytPlayerRef.current) return;
    try {
      if (ytPlayerRef.current.getVideoData) {
        const data = ytPlayerRef.current.getVideoData();
        if (data && data.title) {
          setTrackTitle(data.title);
          setTrackArtist(data.author || 'YouTube Playlist Track');
          if (data.video_id) {
            setTrackThumbnail(`https://img.youtube.com/vi/${data.video_id}/hqdefault.jpg`);
          }
        }
      }
    } catch (e) {
      console.warn("Track info update error", e);
    }
  };

  // Poll progress from YouTube player
  useEffect(() => {
    const interval = setInterval(() => {
      if (ytPlayerRef.current && isYtReady && ytPlayerRef.current.getCurrentTime) {
        try {
          const curr = ytPlayerRef.current.getCurrentTime() || 0;
          const dur = ytPlayerRef.current.getDuration() || 0;
          setAudioCurrentTime(curr);
          setAudioDuration(dur);
          if (dur > 0) {
            setSongProgress((curr / dur) * 100);
          }
          if (curr > 0 && (trackTitle === 'Gaon Ki Saloon Playlist' || !trackTitle)) {
            updateTrackInfo();
          }
        } catch (e) {
          console.warn("Progress update error", e);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isYtReady, trackTitle]);

  // Update clock time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 60000);
    return () => clearInterval(timeInterval);
  }, []);

  const togglePlay = () => {
    if (!ytPlayerRef.current || !isYtReady) return;
    try {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error("Play toggle error", e);
    }
  };

  const handleNextTrack = () => {
    if (!ytPlayerRef.current || !isYtReady) return;
    try {
      ytPlayerRef.current.nextVideo();
      setIsPlaying(true);
      setTimeout(updateTrackInfo, 1000);
    } catch (e) {
      console.error("Next track error", e);
    }
  };

  const handlePrevTrack = () => {
    if (!ytPlayerRef.current || !isYtReady) return;
    try {
      ytPlayerRef.current.previousVideo();
      setIsPlaying(true);
      setTimeout(updateTrackInfo, 1000);
    } catch (e) {
      console.error("Prev track error", e);
    }
  };

  const toggleMute = () => {
    if (!ytPlayerRef.current || !isYtReady) return;
    try {
      if (isMuted) {
        ytPlayerRef.current.unMute();
        setIsMuted(false);
      } else {
        ytPlayerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.error("Mute toggle error", e);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !ytPlayerRef.current || !audioDuration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const seekTime = clickPosition * audioDuration;
    try {
      ytPlayerRef.current.seekTo(seekTime, true);
      setAudioCurrentTime(seekTime);
      setSongProgress(clickPosition * 100);
    } catch (e) {
      console.error("Seek error", e);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 font-sans selection:bg-amber-900 selection:text-amber-50">
      
      {/* Hidden YouTube IFrame API Element */}
      <div className="hidden pointer-events-none opacity-0">
        <div id="yt-player-hidden-element"></div>
      </div>

      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] ease-linear hover:scale-105"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundPosition: 'center 40%'
        }}
      ></div>

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/80 pointer-events-none"></div>
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen p-6 md:p-10 justify-between">
        
        {/* Top Navigation */}
        <header className="flex justify-between items-center w-full animate-fade-in-down">
          
          {/* Left: Time Display */}
          <div className="flex items-center space-x-2 text-stone-300 text-xs font-semibold tracking-widest uppercase backdrop-blur-md bg-black/20 px-4 py-2 rounded-full border border-white/5">
            <Clock size={14} className="text-amber-500/80" />
            <span>{currentTimeStr || '10:00 AM'}</span>
            <span className="hidden sm:inline opacity-50 px-1">|</span>
            <span className="hidden sm:inline">IST</span>
          </div>

          {/* Center: Online Status */}
          <div className="hidden md:flex items-center space-x-2 backdrop-blur-md bg-black/20 px-4 py-2 rounded-full border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
            <span className="text-stone-300 text-xs font-semibold tracking-wider uppercase">Live Saloon Playlist</span>
          </div>

          {/* Right: Developer Attribution */}
          <div className="flex space-x-3">
            <a 
              href="https://shivos.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center h-10 px-4 rounded-full backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/15 hover:border-amber-500/30 transition-all duration-300 shadow-md"
              title="Developer Portfolio"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mr-2"></span>
              <span className="text-xs font-semibold tracking-wider text-stone-200 group-hover:text-amber-300 uppercase">Dev: Shivam</span>
            </a>
          </div>
        </header>

        {/* Center Typography */}
        <main className="flex-1 flex flex-col items-center justify-center text-center mt-12 mb-24 animate-fade-in-up">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-stone-100 to-stone-400 drop-shadow-2xl mb-6 tracking-wide"
              style={{ textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            गाँव की सैलून
          </h1>
          <div className="flex flex-col items-center space-y-3">
             <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
             <p className="text-stone-300/80 text-sm md:text-base font-light tracking-[0.3em] md:tracking-[0.5em] uppercase">
                Gaon Ki Saloon <span className="text-amber-500/50 mx-2">|</span> Traditional Indian Barber
             </p>
          </div>
        </main>

        {/* Bottom Original UI Glassmorphism Music Player */}
        <footer className="w-full max-w-4xl mx-auto flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          
          <div className="w-full md:w-[600px] backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 shadow-2xl transition-all duration-500 hover:bg-black/50 hover:border-white/20 hover:shadow-amber-900/20">
            
            {/* Album Art / Thumbnail */}
            <div className="relative group w-16 h-16 rounded-xl overflow-hidden shadow-lg shrink-0 border border-white/10">
               <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10"></div>
               <img 
                 src={trackThumbnail} 
                 alt="Album Cover" 
                 className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-110' : ''}`}
               />
               {isPlaying && (
                 <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30">
                    <div className="w-6 h-6 border-2 border-amber-400/80 rounded-full flex items-center justify-center animate-spin-slow">
                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    </div>
                 </div>
               )}
            </div>

            {/* Song Info & Controls */}
            <div className="flex-1 w-full flex flex-col justify-center">
              <div className="flex justify-between items-end mb-2 w-full text-center sm:text-left">
                <div className="pr-2 overflow-hidden">
                  <h3 className="text-stone-100 font-medium text-sm sm:text-base tracking-wide truncate">{trackTitle}</h3>
                  <p className="text-amber-500/70 text-xs tracking-wider uppercase mt-0.5 truncate">{trackArtist}</p>
                </div>
                
                {/* Controls (Desktop aligned right) */}
                <div className="hidden sm:flex items-center space-x-3 shrink-0">
                  <button onClick={toggleMute} className="text-stone-400 hover:text-amber-400 transition-colors p-1" title={isMuted ? "Unmute" : "Mute"}>
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <button onClick={handlePrevTrack} className="text-stone-400 hover:text-white transition-colors p-1" title="Previous Track">
                    <SkipBack size={18} fill="currentColor" />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-stone-200 text-black flex items-center justify-center hover:scale-105 hover:bg-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                  </button>
                  <button onClick={handleNextTrack} className="text-stone-400 hover:text-white transition-colors p-1" title="Next Track">
                    <SkipForward size={18} fill="currentColor" />
                  </button>
                </div>
              </div>

              {/* Seekable Progress Bar */}
              <div 
                ref={progressBarRef}
                onClick={handleSeek}
                className="w-full group cursor-pointer py-1.5 flex items-center relative"
              >
                 <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
                   <div 
                     className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-700 to-amber-400 rounded-full transition-all duration-300 ease-linear"
                     style={{ width: `${songProgress}%` }}
                   ></div>
                 </div>
                 {/* Draggable indicator dot */}
                 <div 
                   className="absolute w-3 h-3 bg-white rounded-full shadow border border-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ left: `calc(${songProgress}% - 6px)` }}
                 ></div>
              </div>

              {/* Timestamp Display */}
              <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono mt-0.5">
                <span>{formatTime(audioCurrentTime)}</span>
                
                {/* Controls (Mobile centered below progress bar) */}
                <div className="flex sm:hidden items-center justify-center space-x-5 my-1">
                  <button onClick={toggleMute} className="text-stone-400 hover:text-white p-1">
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <button onClick={handlePrevTrack} className="text-stone-400 hover:text-white transition-colors p-1">
                    <SkipBack size={18} fill="currentColor" />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-stone-200 text-black flex items-center justify-center hover:scale-105 hover:bg-white transition-all shadow-md active:scale-95"
                  >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <button onClick={handleNextTrack} className="text-stone-400 hover:text-white transition-colors p-1">
                    <SkipForward size={18} fill="currentColor" />
                  </button>
                </div>

                <span>{formatTime(audioDuration)}</span>
              </div>

            </div>
          </div>
        </footer>

      </div>

      {/* Global Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in-down {
          animation: fade-in-down 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}} />
    </div>
  );
}