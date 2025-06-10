import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart } from 'lucide-react';

export default function StoryCarousel({ photos, coupleName }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const STORY_DURATION = 5000; // 5 seconds per story

  const progressIntervalRef = useRef(null);
  const autoPlayTimeoutRef = useRef(null);

  const startAutoPlay = useCallback(() => {
    if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
    autoPlayTimeoutRef.current = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % (photos?.length || 1));
    }, STORY_DURATION);
  }, [photos?.length]);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, []);

  const resetAndStartAutoPlay = useCallback(() => {
    stopAutoPlay();
    setProgress(0);
    startAutoPlay();
  }, [stopAutoPlay, startAutoPlay]);
  
  const nextPhoto = useCallback(() => {
    if (!photos || photos.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % photos.length);
  }, [photos]);

  const prevPhoto = useCallback(() => {
    if (!photos || photos.length === 0) return;
    setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos]);

  const goToPhoto = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  // Main effect for controlling timers
  useEffect(() => {
    if (photos && photos.length > 1) {
      resetAndStartAutoPlay();
      
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress(Math.min((elapsed / STORY_DURATION) * 100, 100));
      }, 50);
    }
    
    return () => stopAutoPlay();
  }, [currentIndex, photos, resetAndStartAutoPlay, stopAutoPlay]);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full max-w-sm mx-auto aspect-[9/16] bg-black/20 rounded-3xl flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-white/70 text-lg mb-4">Nenhuma foto adicionada</p>
          <p className="text-white/50">Adicione fotos no Dashboard para criar sua história</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto aspect-[9/16] rounded-3xl overflow-hidden relative select-none">
        
      {/* Photos container - Renders all images for smooth transitions */}
      <div className="absolute inset-0">
        {photos.map((photo, index) => (
          <img
            key={index}
            src={photo.url}
            alt={photo.caption || `Foto ${index + 1}`}
            className="absolute w-full h-full object-cover transition-opacity duration-500 ease-in-out"
            style={{ opacity: index === currentIndex ? 1 : 0 }}
            draggable={false}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-20 pointer-events-none" />
      </div>

      {/* UI Elements Container (Progress, Header) */}
      <div className="absolute top-4 left-4 right-4 z-40">
        <div className="flex gap-1 mb-4">
          {photos.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white"
                style={{ 
                  width: index === currentIndex 
                    ? `${progress}%` 
                    : index < currentIndex 
                      ? '100%' 
                      : '0%',
                  transition: index === currentIndex ? 'width 0.05s linear' : 'width 0.3s ease-in-out'
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF6B6B] rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="text-white font-medium text-lg drop-shadow-md">{coupleName || 'LoveYuu'}</span>
        </div>
      </div>
      
      {/* Caption */}
      {photos[currentIndex]?.caption && (
        <div className="absolute bottom-24 left-4 right-4 z-40 text-center pointer-events-none">
          <p className="text-white text-lg font-light drop-shadow-lg">
            {photos[currentIndex].caption}
          </p>
        </div>
      )}

      {/* Navigation Touch Areas */}
      <div 
        className="absolute left-0 top-0 w-1/2 h-full z-30"
        onClick={prevPhoto}
      />
      <div 
        className="absolute right-0 top-0 w-1/2 h-full z-30"
        onClick={nextPhoto}
      />

      {/* Photo indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-40">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => goToPhoto(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
