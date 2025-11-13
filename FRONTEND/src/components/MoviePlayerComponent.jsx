// src/components/MoviePlayerComponent.jsx
import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";

const MoviePlayerComponent = ({ title, description, videoUrl, poster }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video && Hls.isSupported() && videoUrl.endsWith(".m3u8")) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
    } else if (video) {
      video.src = videoUrl;
    }
  }, [videoUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
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