import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import movieApi from "../api/movieApi";
import userApi from "../api/userApi";
import useAuthStore from "../context/useAuthStore";
import websocketService from "../utils/websocket";
import { toast } from "react-toastify";
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress } from "react-icons/fa";

const SyncedVideoPlayer = ({ movieId, poster, roomId, isHost }) => {
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const { dbUser } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // Prevent sync loops
  
  // Custom Controls State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPos, setHoverPos] = useState(0);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timelineRef = useRef(null);
  const playerContainerRef = useRef(null);

  // Initialize HLS video player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movieId) return;

    const streamUrl = movieApi.getStreamUrl(movieId);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest loaded, ready to play");
        // Attempt to resume playback if we have a saved time and NOT in a watch party
        if (!roomId && window.savedResumeTime && window.savedResumeTime > 0) {
             console.log(`[HLS] Resuming from saved time: ${window.savedResumeTime}`);
             video.currentTime = window.savedResumeTime;
             // Clear it so we don't seek again unexpectedly
             window.savedResumeTime = null;
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else {
      console.error("HLS not supported in this browser");
    }
  }, [movieId, roomId]);

  // Fetch and restore playback progress (Solo Mode Only)
  useEffect(() => {
    const fetchProgress = async () => {
      // Don't auto-resume if we are in a watch party (host controls time)
      if (roomId) return;
      
      if (!movieId || !dbUser || dbUser._isFallback) {
        console.log("Skipping progress fetch (missing ID or user)");
        return;
      }

      try {
        console.log(`[Player] Checking for saved progress...`);
        const progress = await userApi.getMovieProgress(movieId);
        
        if (progress && progress.timestampSeconds > 5 && !progress.completed) {
          console.log(`[Player] Found resumable progress: ${progress.timestampSeconds}s`);
          const video = videoRef.current;
          
          // Store it globally so HLS manifest handler can use it if needed
          window.savedResumeTime = progress.timestampSeconds;

          if (video) {
            const resume = () => {
              console.log(`[Player] Setting currentTime to ${progress.timestampSeconds}`);
              video.currentTime = progress.timestampSeconds;
            };

            // If metadata is loaded, seek immediately. Otherwise wait.
            if (video.readyState >= 1) {
              resume();
            } else {
              console.log(`[Player] Video not ready (readyState=${video.readyState}), waiting for metadata...`);
              video.addEventListener('loadedmetadata', resume, { once: true });
            }
          }
        } else {
          console.log(`[Player] No resumable progress (New watch or completed)`);
        }
      } catch (error) {
        console.error("[Player] Failed to restore progress", error);
      }
    };

    fetchProgress();
  }, [movieId, dbUser, roomId]);

  // Custom Controls Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  // Track progress for history
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !dbUser || dbUser._isFallback) return;

    const updateProgress = async () => {
      try {
        const currentTime = Math.floor(video.currentTime);
        const duration = Math.floor(video.duration);
        
        if (currentTime > 0 && duration > 0) {
          await userApi.updateProgress(movieId, currentTime, duration);
        }
      } catch (error) {
        console.error("Error updating progress:", error);
      }
    };

    const handlePlay = () => {
      progressIntervalRef.current = setInterval(updateProgress, 10000);
    };

    const handlePause = () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      updateProgress();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handlePause);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [movieId, dbUser]);

  // Handle incoming sync messages from WebSocket
  const handleSyncMessage = React.useCallback((message) => {
    const video = videoRef.current;
    if (!video) return;

    console.log('[SYNC] Received sync message:', message);

    // Ignore messages from self
    if (message.userId === dbUser?.id) return;

    // Prevent sending sync events while processing incoming sync
    setIsSyncing(true);

    try {
      // FIRST: Sync time if provided (even small differences to stay in sync)
      if (message.currentTime !== undefined && message.currentTime !== null) {
        const timeDiff = Math.abs(video.currentTime - message.currentTime);
        // Sync if difference > 1 second or if we're about to play
        if (timeDiff > 1 || message.isPlaying) {
          video.currentTime = message.currentTime;
          console.log(`[SYNC] Synced time to ${message.currentTime}s (diff: ${timeDiff.toFixed(2)}s)`);
        }
      }

      // THEN: Sync play/pause state
      if (message.isPlaying !== undefined && message.isPlaying !== null) {
        if (message.isPlaying && video.paused) {
          video.play()
            .then(() => console.log('[SYNC] Playing'))
            .catch(err => console.error('Play error:', err));
        } else if (!message.isPlaying && !video.paused) {
          video.pause();
          console.log('[SYNC] Paused');
        }
      }
    } finally {
      // Reset syncing flag after a short delay
      setTimeout(() => setIsSyncing(false), 500);
    }
  }, [dbUser]);

  // WebSocket connection and sync logic
  useEffect(() => {
    if (!roomId || !dbUser || dbUser._isFallback) return;

    // Connect to WebSocket
    websocketService.connect(
      () => {
        console.log('[WS] WebSocket connected for watch party');
        setIsConnected(true);
        
        // Subscribe to room sync events
        websocketService.subscribe(
          `/topic/watch-party/${roomId}`,
          handleSyncMessage,
          `sync-${roomId}`
        );
        
        // Join the room via WebSocket
        websocketService.send(`/app/watch-party/${roomId}/join`, {
          userId: dbUser.id,
          userName: dbUser.name
        });
      },
      (error) => {
        console.error('[ERROR] WebSocket connection error:', error);
        toast.error('Connection lost. Trying to reconnect...');
        setIsConnected(false);
      }
    );

    return () => {
      // Leave room when component unmounts
      if (websocketService.isConnected()) {
        websocketService.send(`/app/watch-party/${roomId}/leave`, {
          userId: dbUser.id
        });
      }
      websocketService.unsubscribe(`sync-${roomId}`);
    };
  }, [roomId, dbUser, handleSyncMessage]);

  // Send sync events when local player state changes (only if host or democratic mode)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !roomId || !isConnected || !isHost) return;

    const sendSync = (action) => {
      if (isSyncing || !dbUser) return; // Don't send if currently syncing from remote

      const syncData = {
        userId: dbUser.id,
        currentTime: video.currentTime,
        isPlaying: !video.paused,
        action
      };

      websocketService.send(`/app/watch-party/${roomId}/sync`, syncData);
      console.log('[SYNC] Sent sync:', action, syncData);
    };

    const handlePlay = () => sendSync('play');
    const handlePause = () => sendSync('pause');
    const handleSeeking = () => sendSync('seek');

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeking);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeking);
    };
  }, [roomId, isConnected, isHost, isSyncing, dbUser]);

  // --- Custom Control Handlers ---

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    video.muted = newVolume === 0;
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTimelineMouseMove = (e) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const time = percent * duration;
    
    setHoverTime(time);
    setHoverPos(x);
    setTimelineWidth(rect.width);
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const time = percent * duration;
    
    videoRef.current.currentTime = time;
  };

  const getThumbnailUrl = (time) => {
    if (!time && time !== 0) return '';
    // 1 frame every 10 seconds. Index starts at 1.
    const index = Math.floor(time / 10) + 1;
    const indexStr = index.toString().padStart(4, '0');
    const baseUrl = movieApi.getStreamUrl(movieId).replace('master.m3u8', '');
    return `${baseUrl}thumb_${indexStr}.jpg`;
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto py-10 px-4">
      {/* Connection Status Indicator */}
      {roomId && (
        <div className="w-full mb-4 flex items-center justify-between bg-zinc-800 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-sm text-gray-300">
              {isConnected ? 'Connected to watch party' : 'Connecting...'}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {isHost ? 'Host (You control playback)' : 'Participant'}
          </div>
        </div>
      )}

      {/* Video Player Container */}
      <div 
        ref={playerContainerRef}
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg group select-none"
      >
        <video
          ref={videoRef}
          poster={poster}
          className="w-full h-full cursor-pointer"
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
        />

        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-10 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
          
          {/* Timeline */}
          <div 
            ref={timelineRef}
            className="relative w-full h-1.5 bg-gray-600/50 rounded cursor-pointer mb-4 group/timeline hover:h-2.5 transition-all"
            onMouseMove={handleTimelineMouseMove}
            onMouseLeave={() => setHoverTime(null)}
            onClick={handleTimelineClick}
          >
            {/* Buffered/Loaded (Optional - can add later) */}
            
            {/* Progress Bar */}
            <div 
              className="absolute top-0 left-0 h-full bg-red-600 rounded"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
               {/* Handle */}
               <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-red-600 rounded-full scale-0 group-hover/timeline:scale-100 transition-transform" />
            </div>

            {/* Hover Thumbnail Tooltip */}
            {hoverTime !== null && (
              <div 
                className="absolute bottom-6 transform -translate-x-1/2 border border-gray-700 rounded-lg overflow-hidden shadow-2xl bg-black z-50"
                style={{ 
                  left: Math.max(85, Math.min(timelineWidth - 85, hoverPos)) 
                }}
              >
                <div className="relative">
                  <img 
                    src={getThumbnailUrl(hoverTime)} 
                    alt="Preview" 
                    className="w-40 h-24 object-cover bg-gray-900"
                    onError={(e) => e.target.style.display = 'none'} 
                  />
                  <div className="absolute bottom-0 left-0 right-0 text-center text-xs font-bold text-white bg-black/60 py-1 backdrop-blur-sm">
                    {formatTime(hoverTime)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="hover:text-red-500 transition p-1">
                {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
              </button>
              
              <div className="flex items-center gap-3 group/volume">
                <button onClick={toggleMute} className="hover:text-gray-300 transition p-1">
                  {isMuted || volume === 0 ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={isMuted ? 0 : volume} 
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              <span className="text-sm font-medium text-gray-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-4">
               <button onClick={toggleFullscreen} className="hover:text-gray-300 transition p-1">
                 {isFullscreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Host Controls Info */}
      {roomId && !isHost && (
        <div className="mt-4 text-sm text-gray-400 text-center">
          Only the host can control playback. Your player will sync automatically.
        </div>
      )}
    </div>
  );
};

export default SyncedVideoPlayer;
