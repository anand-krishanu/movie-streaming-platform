// src/components/MoviePlayerComponent.jsx
import React, { useRef, useEffect } from "react";
import Hls from "hls.js";
import movieApi from "../api/movieApi";
import userApi from "../api/userApi";
import useAuthStore from "../context/useAuthStore";

const MoviePlayerComponent = ({ movieId, poster }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const { dbUser } = useAuthStore();

  // Ambient Mode Effect
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: false, // Optimization: We don't need transparency
      desynchronized: true, // Optimization: Hint to browser to bypass compositor
    });
    let animationFrameId;

    const drawAmbient = () => {
      if (!video.paused && !video.ended) {
        // Draw the current video frame to the canvas
        // The canvas is small (set in JSX), so this is very fast
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        animationFrameId = requestAnimationFrame(drawAmbient);
      }
    };

    const handlePlay = () => {
      drawAmbient();
    };

    const handlePause = () => {
      cancelAnimationFrame(animationFrameId);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handlePause);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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
      {/* Container for Video + Ambient Background */}
      <div className="relative w-full aspect-video">
        {/* Ambient Canvas - Positioned behind with heavy blur */}
        <canvas
          ref={canvasRef}
          width={100} // Low internal resolution for performance
          height={56} // 16:9 aspect ratio
          className="absolute top-0 left-0 w-full h-full -z-10 blur-3xl opacity-60 scale-110 transition-opacity duration-500"
          aria-hidden="true"
        />
        
        {/* Main Video Player */}
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-lg z-10">
          <video
            ref={videoRef}
            poster={poster}
            controls
            className="w-full h-full"
            crossOrigin="anonymous" // Important for canvas security if video is from different domain
          />
        </div>
      </div>
    </div>
  );
};

export default MoviePlayerComponent;