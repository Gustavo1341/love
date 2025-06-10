// src/entities/CoupleConfig.js

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

/**
 * Função genérica para fazer requisições à nossa API com tratamento de erro e retry.
 * @param {string} url - A URL da API.
 * @param {object} options - As opções para a função fetch.
 * @param {number} maxRetries - Número máximo de tentativas (padrão: 2)
 * @returns {Promise<any>} - O corpo da resposta em JSON.
 */
async function apiRequest(url, options = {}, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Se não for a primeira tentativa, adiciona um pequeno delay
      if (attempt > 0) {
        console.log(`CoupleConfig: Tentativa ${attempt}/${maxRetries} para ${url}`);
        // Espera um tempo progressivo entre tentativas (300ms, 600ms, etc)
        await new Promise(r => setTimeout(r, 300 * attempt));
      }
      
      // Usa um timeout maior que o padrão do navegador
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos
      
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId); // Limpa o timeout se a requisição foi bem sucedida
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP error! Status: ${response.status}` 
        }));
        throw new Error(errorData.message || 'Erro desconhecido na API');
      }

      // Retorna null se a resposta não tiver corpo (ex: status 204)
      const text = await response.text();
      return text ? JSON.parse(text) : null;

    } catch (error) {
      lastError = error;
      
      // Loga o erro apenas se for a última tentativa ou um erro de abort
      if (attempt === maxRetries || error.name === 'AbortError') {
        console.error(`CoupleConfig: Erro na tentativa ${attempt+1}/${maxRetries+1}: ${error.message || error}`);
      }
      
      // Se o erro for um timeout ou AbortError, tentamos novamente
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        continue; // tenta novamente
      } else {
        // Para outros tipos de erro (como problemas de servidor), lançamos o erro
        throw error;
      }
    }
  }
  
  // Se chegamos aqui, significa que todas as tentativas falharam
  throw lastError;
}

export const CoupleConfig = {
  async list() {
    console.log("CoupleConfig: Verificando cache...");
    if (configCache.isValid()) {
      console.log("CoupleConfig: Usando dados do cache.");
      return [configCache.data];
    }
    
    try {
      console.log("CoupleConfig: Buscando dados da API /api/config...");
      const data = await apiRequest('/api/config', { method: 'GET' });
      
      if (data) {
        configCache.set(data);
        console.log("CoupleConfig: Cache atualizado com sucesso.");
        return [data];
      }
      
      console.log("CoupleConfig: Nenhum dado de configuração encontrado.");
      return [];

    } catch (error) {
      console.error("CoupleConfig.list falhou:", error);
      // Retorna array vazio em caso de erro para não quebrar a UI
      return [];
    }
  },

  async create(data) {
    try {
      console.log("CoupleConfig: Criando nova configuração...");
      const result = await apiRequest('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      // Limpa o cache antigo e atualiza com o novo resultado
      configCache.set(result);
      console.log("CoupleConfig: Configuração criada e cache atualizado.");
      return result;
    } catch (error) {
       console.error("CoupleConfig.create falhou:", error);
       throw error; // Propaga o erro para a UI
    }
  },
  
  async update(id, data) {
    try {
      console.log(`CoupleConfig: Atualizando configuração ID ${id}...`);
      const result = await apiRequest('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, id }),
      });
      
      // Limpa o cache antigo e atualiza com o novo resultado
      configCache.set(result);
      console.log(`CoupleConfig: Configuração ID ${id} atualizada e cache atualizado.`);
      return result;
    } catch (error) {
        console.error(`CoupleConfig.update falhou para o ID ${id}:`, error);
        throw error; // Propaga o erro para a UI
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