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
      console.log("Home: Carregando configuração...");
      const startTime = Date.now();
      
      // Implementação robusta com retry
      let configData = null;
      let loadingError = null;
      
      // Tentativas máximas
      const maxAttempts = 3;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`Home: Tentando carregar configuração (tentativa ${attempt}/${maxAttempts})...`);
          
          // Definimos um timeout mais longo a cada tentativa
          const timeoutMs = 12000 * attempt; // 12s, 24s, 36s
          
          // Função que vai tentar fazer o carregamento
          const attemptLoad = async () => {
            try {
              return await CoupleConfig.list();
            } catch (err) {
              console.error(`Home: Erro capturado em attemptLoad: ${err.message}`);
              throw err;
            }
          };
          
          // Promise com timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              console.warn(`Home: Timeout de ${timeoutMs}ms atingido na tentativa ${attempt}`);
              reject(new Error(`Timeout após ${timeoutMs}ms`));
            }, timeoutMs);
          });
          
          // Fazemos a requisição com timeout
          configData = await Promise.race([
            attemptLoad(),
            timeoutPromise
          ]);
          
          console.log(`Home: Configuração carregada com sucesso na tentativa ${attempt}`);
          break; // Se chegou aqui, deu certo, podemos sair do loop
          
        } catch (error) {
          console.error(`Home: Erro na tentativa ${attempt}: ${error.message}`);
          loadingError = error;
          
          // Se não é a última tentativa, esperamos um pouco e tentamos de novo
          if (attempt < maxAttempts) {
            const waitTime = Math.min(1500 * Math.pow(2, attempt - 1), 8000);
            console.log(`Home: Aguardando ${waitTime}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      console.log(`Home: Configuração carregada em ${Date.now() - startTime}ms`);
      
      if (configData && configData.length > 0) {
        setConfig(configData[0]);
      } else {
        console.log("Home: Nenhuma configuração encontrada ou configuração vazia");
      }
      
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      // Mesmo em caso de erro, permitimos que a página carregue para melhor UX
    } finally {
      setIsLoading(false);
    }
  };

  // Renderiza a UI imediatamente, mesmo enquanto carrega
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
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

      {isLoading ? (
        <div className="w-full max-w-md mx-auto space-y-8 relative z-20 flex flex-col items-center">
          <div className="pulse-animation">
            <div className="w-16 h-16 bg-[#FF6B6B] rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">♥</span>
            </div>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
