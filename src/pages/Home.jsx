import React, { useState, useEffect } from "react";
import { CoupleConfig } from "../entities/CoupleConfig";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Settings } from "lucide-react";

import FallingHearts from "../components/FallingHearts";
import StoryCarousel from "../components/StoryCarousel";
import TimeCounter from "../components/TimeCounter";
import BackgroundMusic from "../components/BackgroundMusic";

export default function Home() {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configs = await CoupleConfig.list();
      if (configs.length > 0) {
        setConfig(configs[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#202026' }}>
        <div className="pulse-animation">
          <div className="w-16 h-16 bg-[#FF6B6B] rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">♥</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <FallingHearts />
      <BackgroundMusic musicUrl={config?.background_music_url} />

      {/* Hidden Settings button */}
      <Link
        to={createPageUrl("Dashboard")}
        className="fixed top-4 left-4 z-50 w-8 h-8 flex items-center justify-center opacity-0 hover:opacity-50 transition-opacity"
        title="Acessar Dashboard"
      >
        <Settings className="w-5 h-5 text-white" />
      </Link>

      <div className="w-full max-w-md mx-auto space-y-8 relative z-20">
        {/* O componente agora controla sua própria borda, sem necessidade de um wrapper aqui */}
        <StoryCarousel
          photos={config?.photos || []}
          coupleName={config?.couple_name}
        />

        {/* Time Counter */}
        <TimeCounter
          startDate={config?.relationship_start}
          customPhrase={config?.custom_phrase}
        />

        {/* Heart button */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#FF6B6B] rounded-full flex items-center justify-center pulse-animation">
            <span className="text-white text-2xl">♥</span>
          </div>
        </div>
      </div>
    </div>
  );
}
