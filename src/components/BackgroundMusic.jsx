import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function BackgroundMusic({ musicUrl }) {
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const playAudio = async () => {
      if (musicUrl && audioRef.current) {
        audioRef.current.src = musicUrl;
        try {
          await audioRef.current.play();
        } catch (error) {
          console.log("A reprodução automática foi bloqueada. O usuário precisa interagir com a página.");
          // A reprodução automática pode ser bloqueada, aguardando interação do usuário.
        }
      }
    };
    playAudio();
  }, [musicUrl]);
  
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  };

  if (!musicUrl) return null;

  return (
    <>
      <audio 
        ref={audioRef}
        loop
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />
      <button 
        onClick={toggleMute} 
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#FF6B6B]/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>
    </>
  );
}