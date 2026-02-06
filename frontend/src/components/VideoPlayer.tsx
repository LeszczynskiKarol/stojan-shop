// components/VideoPlayer.tsx
'use client';
import React, { useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
}

export const VideoPlayer = ({ videoId, title = 'Video', className = '' }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Tworzymy URL z parametrami zapewniającymi lepszą kontrolę
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${
    isPlaying ? 1 : 0
  }&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&controls=0&showinfo=0`;

  // Obsługa hover state
  const handleMouseEnter = useCallback(() => {
    setShowControls(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowControls(false);
  }, []);

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto aspect-video rounded-lg overflow-hidden group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Warstwa z gradientem */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />

      {/* Właściwy iframe z filmem */}
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      {/* Warstwa kontrolna - pojawia się przy hover */}
      <div
        className={`absolute inset-0 z-20 flex flex-col justify-between p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Górny pasek z tytułem */}
        <div className="flex justify-between items-center">
          <h3 className="text-white text-xl font-semibold drop-shadow-lg">{title}</h3>
        </div>

        {/* Dolny pasek z kontrolkami */}
        <div className="flex items-center justify-between">
          {/* Lewe kontrolki */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all transform hover:scale-105"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </button>

            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all transform hover:scale-105">
              <Volume2 className="w-6 h-6 text-white" />
            </button>

            {/* Progress bar */}
            <div className="hidden sm:block w-32 md:w-64 h-1 bg-white/30 rounded-full">
              <div className="h-full w-0 bg-primary rounded-full transition-all" />
            </div>
          </div>

          {/* Prawe kontrolki */}
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all transform hover:scale-105">
              <Maximize2 className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay na start - znika po rozpoczęciu odtwarzania */}
      {!isPlaying && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer"
          onClick={() => setIsPlaying(true)}
        >
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-primary/90 hover:bg-primary transition-all transform hover:scale-105">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
};
