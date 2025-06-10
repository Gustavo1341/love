import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

export default function FallingHearts() {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    const createHeart = () => {
      const newHeart = {
        id: Date.now() + Math.random(),
        left: Math.random() * 95, // Leave some margin from edges
        size: Math.random() * 0.4 + 0.6, // Size between 0.6 and 1
        animationDuration: Math.random() * 2 + 4, // 4-6 seconds
        animationDelay: Math.random() * 1 // 0-1 second delay
      };
      
      setHearts(prev => [...prev, newHeart]);
      
      // Remove heart after animation completes
      setTimeout(() => {
        setHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
      }, (newHeart.animationDuration + newHeart.animationDelay) * 1000);
    };

    // Create hearts at intervals
    const interval = setInterval(createHeart, 800);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute"
          style={{
            left: `${heart.left}%`,
            top: '-60px', // Start above viewport
            transform: `scale(${heart.size})`,
            animation: `heartFall ${heart.animationDuration}s linear ${heart.animationDelay}s forwards`
          }}
        >
          <Heart
            className="w-6 h-6 text-[#FF6B6B]"
            fill="currentColor"
          />
        </div>
      ))}
    </div>
  );
}