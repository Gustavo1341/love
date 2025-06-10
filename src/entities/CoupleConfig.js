// src/entities/CoupleConfig.js
const CONFIG_KEY = 'coupleConfigLoveYuu';

// Helper para simular um delay de API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const CoupleConfig = {
  async list() {
    await delay(300); // Simula latência da rede
    const data = localStorage.getItem(CONFIG_KEY);
    return data ? [JSON.parse(data)] : [];
  },

  async create(data) {
    await delay(500);
    const newConfig = { ...data, id: Date.now().toString() }; // Adiciona um ID simples
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    return newConfig;
  },

  async update(id, data) {
    await delay(500);
    const existingConfigs = await this.list();
    if (existingConfigs.length > 0 && existingConfigs[0].id === id) {
      const updatedConfig = { ...existingConfigs[0], ...data };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(updatedConfig));
      return updatedConfig;
    }
    throw new Error("Config not found for update or ID mismatch");
  },

  // Opcional: método para limpar/resetar para testes
  async _clear() {
    localStorage.removeItem(CONFIG_KEY);
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