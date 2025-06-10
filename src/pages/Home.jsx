import React, { useState, useEffect } from "react";
// Forçando um novo deploy para limpar o cache da Vercel - 2024-07-22
import { CoupleConfig } from "../entities/CoupleConfig";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Settings, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    setIsLoading(true);
    try {
      console.log("Home: Carregando configuração...");
      const configs = await CoupleConfig.list();
      
      if (configs && configs.length > 0) {
        setConfig(configs[0]);
        console.log("Home: Configuração carregada com sucesso.");
      } else {
        console.log("Home: Nenhuma configuração encontrada.");
      }
    } catch (error) {
      console.error("Home: Falha ao carregar configuração:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center">
           <Heart className="w-16 h-16 text-[#FF6B6B] animate-pulse" />
           <p className="text-white mt-4">Carregando sua história...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-center text-white">
        <div>
          <h1 className="text-4xl font-bold mb-4">Bem-vindo(a) à sua História de Amor!</h1>
          <p className="text-xl mb-8">Parece que vocês ainda não configuraram sua página.</p>
          <Link to={createPageUrl('Dashboard')}>
            <Button size="lg" className="bg-[#FF6B6B] hover:bg-[#ff4f4f]">
              <Heart className="mr-2 h-5 w-5" />
              Começar a Configurar Agora
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FallingHearts />
      {config?.background_music_url && <BackgroundMusic musicUrl={config.background_music_url} />}

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
