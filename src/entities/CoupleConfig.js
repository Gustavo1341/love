// src/entities/CoupleConfig.js

// Função helper para timeout com várias medidas de segurança
const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
  console.log(`CoupleConfig: Iniciando fetch para ${url} com timeout de ${timeoutMs}ms`);
  
  // Usar dois mecanismos de timeout para redundância
  const controller = new AbortController();
  
  // Timeout #1: Via AbortController
  const abortTimeoutId = setTimeout(() => {
    console.warn(`CoupleConfig: AbortController timeout de ${timeoutMs}ms atingido para ${url}`);
    controller.abort();
  }, timeoutMs);
  
  // Timeout #2: Via Promise.race (redundância)
  const timeoutPromise = new Promise((_, reject) => {
    const id = setTimeout(() => {
      console.warn(`CoupleConfig: Promise timeout de ${timeoutMs}ms atingido para ${url}`);
      reject(new Error(`Timeout de ${timeoutMs}ms atingido`));
    }, timeoutMs + 1000); // Um pouco mais longo que o primeiro para dar chance ao AbortController
    
    // Garantir que o timeout seja limpo se a Promise for resolvida
    return () => clearTimeout(id);
  });
  
  try {
    // Usando Promise.race para ter redundância no timeout
    const response = await Promise.race([
      fetch(url, {
        ...options,
        signal: controller.signal,
        // Adicionando headers para evitar cache
        headers: {
          ...options.headers,
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Timestamp': Date.now().toString()
        }
      }),
      timeoutPromise
    ]);
    
    console.log(`CoupleConfig: Fetch para ${url} concluído com status ${response.status}`);
    return response;
  } finally {
    clearTimeout(abortTimeoutId);
  }
};

// Cache em memória para armazenar os dados entre navegações
const configCache = {
  data: null,
  timestamp: 0,
  // Cache válido por 5 minutos
  isValid: function() {
    return this.data && (Date.now() - this.timestamp < 5 * 60 * 1000);
  },
  set: function(data) {
    this.data = data;
    this.timestamp = Date.now();
  },
  clear: function() {
    this.data = null;
    this.timestamp = 0;
  }
};

export const CoupleConfig = {
  async list() {
    try {
      console.log("CoupleConfig: Verificando cache...");
      
      // Se temos dados em cache válidos, use-os
      if (configCache.isValid()) {
        console.log("CoupleConfig: Usando dados do cache");
        return [configCache.data];
      }
      
      console.log("CoupleConfig: Cache expirado ou vazio, buscando dados frescos");
      console.log("CoupleConfig: Iniciando busca de configurações");
      const startTime = Date.now();
      
      // Implementando sistema de retry
      const maxRetries = 3;
      let lastError = null;
      
      // Usamos uma Promise que não vai rejeitar, apenas resolver com o resultado ou erro
      // Isso evita que a Promise seja rejeitada prematuramente
      return await new Promise(resolve => {
        const attemptFetch = async (attempt) => {
          try {
            console.log(`CoupleConfig: Tentativa ${attempt}/${maxRetries} de buscar configuração`);
            
            // Aumentamos o timeout a cada tentativa
            const currentTimeout = 8000 * attempt; // 8s, 16s, 24s
            
            const response = await fetchWithTimeout('/api/config', {}, currentTimeout);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`CoupleConfig: Erro na resposta (status ${response.status}):`, errorText);
              
              let errorMessage;
              try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || `Failed with status: ${response.status}`;
              } catch (e) {
                errorMessage = errorText || `Failed with status: ${response.status}`;
              }
              
              throw new Error(errorMessage);
            }
            
            let data;
            try {
              data = await response.json();
            } catch (jsonError) {
              console.error("CoupleConfig: Erro ao processar JSON:", jsonError);
              throw new Error("Falha ao processar resposta como JSON");
            }
            
            console.log(`CoupleConfig: Busca concluída em ${Date.now() - startTime}ms`);
            
            // Salva os dados no cache somente se não estiver vazio
            if (data && Object.keys(data).length > 0) {
              configCache.set(data);
              console.log("CoupleConfig: Dados salvos no cache");
            } else {
              console.log("CoupleConfig: Dados vazios, não foram salvos no cache");
            }
            
            // Resolvemos a Promise com os dados
            resolve(data ? [data] : []);
            return;
          } catch (error) {
            console.error(`CoupleConfig: Erro na tentativa ${attempt}/${maxRetries}:`, error.message);
            lastError = error;
            
            // Se não é a última tentativa, vamos tentar novamente
            if (attempt < maxRetries) {
              // Espera um pouco antes de tentar novamente (backoff exponencial)
              const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
              console.log(`CoupleConfig: Aguardando ${waitTime}ms antes da próxima tentativa...`);
              
              // Esperamos e tentamos novamente
              setTimeout(() => attemptFetch(attempt + 1), waitTime);
              return;
            }
            
            // Se chegou aqui, é a última tentativa e falhou
            console.error("CoupleConfig: Todas as tentativas falharam:", lastError);
            
            // Em vez de lançar erro, retornamos uma lista vazia
            // Isso evita o erro "signal is aborted without reason"
            resolve([]);
            return;
          }
        };
        
        // Iniciamos a primeira tentativa
        attemptFetch(1);
      });
      
    } catch (error) {
      console.error("CoupleConfig list error:", error);
      // Retornamos uma lista vazia em caso de erro para não quebrar a UI
      return [];
    }
  },

  async create(data) {
    console.log("CoupleConfig: Criando nova configuração");
    const startTime = Date.now();
    
    try {
      // Implementando sistema de retry
      const maxRetries = 3;
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`CoupleConfig: Tentativa ${attempt}/${maxRetries} de criar configuração`);
          
          // Aumentamos o timeout a cada tentativa
          const currentTimeout = 10000 * attempt; // 10s, 20s, 30s
          
          const response = await fetchWithTimeout('/api/config', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }, currentTimeout);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`CoupleConfig: Erro na resposta (status ${response.status}):`, errorText);
            
            let errorMessage;
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorJson.error || `Failed with status: ${response.status}`;
            } catch (e) {
              errorMessage = errorText || `Failed with status: ${response.status}`;
            }
            
            throw new Error(errorMessage);
          }
          
          let result;
          try {
            result = await response.json();
          } catch (jsonError) {
            console.error("CoupleConfig: Erro ao processar JSON:", jsonError);
            throw new Error("Falha ao processar resposta como JSON");
          }
          
          console.log(`CoupleConfig: Criação concluída em ${Date.now() - startTime}ms`);
          
          // Atualiza o cache com os novos dados
          configCache.set(result);
          
          return result;
        } catch (error) {
          console.error(`CoupleConfig: Erro na tentativa ${attempt}/${maxRetries}:`, error.message);
          lastError = error;
          
          // Se não é a última tentativa, vamos tentar novamente
          if (attempt < maxRetries) {
            // Espera um pouco antes de tentar novamente (backoff exponencial)
            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`CoupleConfig: Aguardando ${waitTime}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          // Se é a última tentativa, lançamos o erro
          throw error;
        }
      }
      
      // Este ponto só é atingido se todas as tentativas falharem
      throw lastError || new Error("Falha em todas as tentativas de criar configuração");
      
    } catch (error) {
      console.error("CoupleConfig create error:", error);
      throw error; // Propagamos o erro para que o usuário saiba que algo falhou
    }
  },

  async update(id, data) {
    console.log(`CoupleConfig: Atualizando configuração ID ${id}`);
    const startTime = Date.now();
    
    try {
      const response = await fetchWithTimeout('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, id }),
      }, 10000);
      
      if (!response.ok) {
        throw new Error(`Failed to update config: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`CoupleConfig: Atualização concluída em ${Date.now() - startTime}ms`);
      
      // Atualiza o cache com os dados atualizados
      configCache.set(result);
      
      return result;
    } catch (error) {
      console.error("CoupleConfig update error:", error);
      throw error; // Propagamos o erro para que o usuário saiba que algo falhou
    }
  },
  
  // Método para limpar o cache manualmente se necessário
  clearCache() {
    console.log("CoupleConfig: Limpando cache");
    configCache.clear();
  }
};

// Você pode também exportar o schema se precisar dele em outro lugar
export const schema = {
  "name": "CoupleConfig",
  "type": "object",
  "properties": {
    "name": "CoupleConfig",
    "type": "object",
    "properties": {
      "couple_name": {
        "type": "string",
        "description": "Nome do casal (ex: João & Maria)"
      },
      "relationship_start": {
        "type": "string",
        "format": "datetime-local",
        "description": "Data e hora do início do relacionamento"
      },
      "background_music_url": {
        "type": "string",
        "description": "URL da música de fundo"
      },
      "photos": {
        "type": "array",
        "description": "Fotos do casal para o carrossel",
        "items": {
          "type": "object",
          "properties": {
            "url": {
              "type": "string"
            },
            "caption": {
              "type": "string"
            }
          }
        }
      },
      "custom_phrase": {
        "type": "string",
        "description": "Uma frase especial para aparecer abaixo do contador"
      }
    },
    "required": []
  }
};