// src/integrations/Core.js

// Helper para simular um delay de API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const UploadFile = async ({ file }) => {
  if (!file) {
    throw new Error("No file provided to UploadFile function.");
  }

  const response = await fetch(
    `/api/upload?filename=${encodeURIComponent(file.name)}`,
    {
      method: 'POST',
      body: file,
    },
  );

  if (!response.ok) {
    const errorResult = await response.json();
    throw new Error(errorResult.message || "Failed to upload file.");
  }

  const newBlob = await response.json();

  // A resposta da API do Vercel Blob contém a URL do arquivo
  return {
    file_url: newBlob.url,
  };
};