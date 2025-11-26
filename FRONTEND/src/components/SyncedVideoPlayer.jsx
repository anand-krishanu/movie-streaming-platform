import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import movieApi from "../api/movieApi";
import userApi from "../api/userApi";
import useAuthStore from "../context/useAuthStore";
import websocketService from "../utils/websocket";
import { toast } from "react-toastify";

const SyncedVideoPlayer = ({ movieId, poster, roomId, isHost }) => {
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const { dbUser } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // Prevent sync loops
  
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
  }, [movieId]);

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

      {/* Video Player */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          poster={poster}
          controls
          className="w-full h-full"
        />
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
