// src/components/SecureMoviePlayer.jsx
// NEW SECURE VIDEO PLAYER - Uses tokenized streaming with Redis caching
import React, { useRef, useEffect } from "react";
import Hls from "hls.js";
import movieApi from "../api/movieApi";
import userApi from "../api/userApi";
import useAuthStore from "../context/useAuthStore";

/**
 * Secure Movie Player Component
 * 
 * Features:
 * - Tokenized video segments (tokens expire in 5-10 min)
 * - Redis-cached permission checks (10-50x faster)
 * - Automatic fallback to old endpoint if secure fails
 * - Progress tracking and resume functionality
 * 
 * Usage:
 * <SecureMoviePlayer movieId="abc123" poster="https://..." />
 */
const SecureMoviePlayer = ({ movieId, poster }) => {
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const { dbUser } = useAuthStore();
  const hlsRef = useRef(null);

  // Fetch and restore playback progress
  useEffect(() => {
    const fetchProgress = async () => {
      if (!movieId || !dbUser || dbUser._isFallback) {
        return;
      }

      try {
        const progress = await userApi.getMovieProgress(movieId);
        
        if (progress && progress.timestampSeconds > 5 && !progress.completed) {
          
          if (video) {
            const resume = () => {
              video.currentTime = progress.timestampSeconds;
            };

            if (video.readyState >= 1) {
              resume();
            } else {
              video.addEventListener('loadedmetadata', resume, { once: true });
            }
          }
        }
      } catch (error) {
        // Silent error handling
      }
    };

    fetchProgress();
  }, [movieId, dbUser]);

  // Load secure video stream with tokenized segments
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movieId) return;

    const loadSecureStream = async () => {
      try {
        const { playlistUrl, expiresIn } = await movieApi.getSecureStreamUrl(movieId);
        
        // Build full URL
        const baseURL = movieApi.getStreamUrl('').replace('/movies/stream//master.m3u8', '');
        const fullUrl = `${baseURL}${playlistUrl}`;
        
        if (Hls.isSupported()) {
          // Clean up previous HLS instance if exists
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }

          const hls = new Hls({
            // Enable debugging for development
            debug: false,
            // Retry settings for token expiration
            manifestLoadingMaxRetry: 3,
            levelLoadingMaxRetry: 3,
            fragLoadingMaxRetry: 3,
          });
          
          hlsRef.current = hls;
          hls.loadSource(fullUrl);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            // Manifest loaded
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.details === 'manifestLoadError' || data.details === 'fragLoadError') {
              setTimeout(() => loadSecureStream(), 1000);
            }
          });

          if (expiresIn) {
            const refreshTime = expiresIn * 0.8 * 1000;
            
            setTimeout(() => {
              loadSecureStream();
            }, refreshTime);
          }

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = fullUrl;
        }

      } catch (error) {
        
        // Fallback to old endpoint
        const streamUrl = movieApi.getStreamUrl(movieId);
        
        if (Hls.isSupported()) {
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }
          const hls = new Hls();
          hlsRef.current = hls;
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
        }
      }
    };

    loadSecureStream();

    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [movieId]);

  // Track progress every 10 seconds
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
        // Silent error handling
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

    const handleEnded = () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      updateProgress();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [movieId, dbUser]);

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: "100%", maxHeight: "80vh", backgroundColor: "black" }}
      poster={poster}
    />
  );
};

export default SecureMoviePlayer;
