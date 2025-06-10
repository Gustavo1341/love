// src/entities/CoupleConfig.js

export const CoupleConfig = {
  async list() {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error('Failed to fetch config');
    }
    const data = await response.json();
    return data ? [data] : [];
  },

  async create(data) {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create config');
    }
    return await response.json();
  },

  async update(id, data) {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // A API sabe que é um update por causa da presença do 'id'
      body: JSON.stringify({ ...data, id }),
    });
    if (!response.ok) {
      throw new Error('Failed to update config');
    }
    return await response.json();
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