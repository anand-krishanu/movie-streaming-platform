// src/components/MoviePlayerComponent.jsx
import React, { useRef, useEffect } from "react";
import Hls from "hls.js";
import movieApi from "../api/movieApi";
import userApi from "../api/userApi";
import useAuthStore from "../context/useAuthStore";

const MoviePlayerComponent = ({ movieId, poster }) => {
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const { dbUser } = useAuthStore();

  // Fetch and restore playback progress
  useEffect(() => {
    const fetchProgress = async () => {
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
  }, [movieId, dbUser]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movieId) return;

    // Get the HLS streaming URL from the Spring Boot backend
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
      // For Safari which has native HLS support
      video.src = streamUrl;
    } else {
      console.error("HLS not supported in this browser");
    }
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
        console.error("Error updating progress:", error);
      }
    };

    // Update progress every 10 seconds while playing
    const handlePlay = () => {
      progressIntervalRef.current = setInterval(updateProgress, 10000);
    };

    const handlePause = () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      // Update progress one last time when pausing
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

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto py-10 px-4">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          poster={poster}
          controls
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default MoviePlayerComponent;