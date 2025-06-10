// src/integrations/Core.js

// Helper para simular um delay de API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const UploadFile = async ({ file }) => {
  await delay(1000); // Simula o tempo de upload
  console.log("Simulando upload do arquivo:", file.name, file.type);

  // Para fotos, podemos retornar um placeholder ou o próprio arquivo como URL local (para testes)
  // Para uma simulação mais realista, você pode usar um serviço de placeholder de imagem
  if (file.type.startsWith('image/')) {
    return {
      file_url: URL.createObjectURL(file), // Cria uma URL local para o arquivo
      // file_url: `https://via.placeholder.com/400x600.png?text=${encodeURIComponent(file.name)}`,
    };
  } else if (file.type.startsWith('audio/')) {
    // Para áudio, também podemos usar URL.createObjectURL
    return {
      file_url: URL.createObjectURL(file),
    };
  }
  // Fallback
  return {
    file_url: `https://example.com/uploads/${Date.now()}_${file.name}`,
  };
};