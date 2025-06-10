// src/entities/CoupleConfig.js

// Função auxiliar para fazer requisições com timeout
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
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
      
      const response = await fetchWithTimeout('/api/config', {}, 8000);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`CoupleConfig: Busca concluída em ${Date.now() - startTime}ms`);
      
      // Salva os dados no cache
      if (data) {
        configCache.set(data);
      }
      
      return data ? [data] : [];
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
      const response = await fetchWithTimeout('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }, 10000);
      
      if (!response.ok) {
        throw new Error(`Failed to create config: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`CoupleConfig: Criação concluída em ${Date.now() - startTime}ms`);
      
      // Atualiza o cache com os novos dados
      configCache.set(result);
      
      return result;
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