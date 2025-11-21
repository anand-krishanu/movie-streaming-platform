// src/components/MoviePlayerComponent.jsx
import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import movieApi from "../api/movieApi";
import userApi from "../api/userApi";
import useAuthStore from "../context/useAuthStore";

const MoviePlayerComponent = ({ movieId, title, description, poster }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const progressIntervalRef = useRef(null);
  const { dbUser } = useAuthStore();

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
      setIsPlaying(true);
      progressIntervalRef.current = setInterval(updateProgress, 10000);
    };

    const handlePause = () => {
      setIsPlaying(false);
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

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

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

      <div className="mt-5 w-full">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>

      <button
        onClick={togglePlay}
        className="mt-5 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
    </div>
  );
};

export default MoviePlayerComponent;