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
        // Ready to play
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        // Error handling
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
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
        // Silent error handling
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