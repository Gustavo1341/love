// src/integrations/Core.js

// Função helper para timeout
const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
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

export const UploadFile = async ({ file }) => {
  if (!file) {
    throw new Error("No file provided to UploadFile function.");
  }
  
  console.log(`Iniciando upload do arquivo: ${file.name} (${file.size} bytes)`);
  const startTime = Date.now();

  try {
    const response = await fetchWithTimeout(
      `/api/upload?filename=${encodeURIComponent(file.name)}`,
      {
        method: 'POST',
        body: file,
      },
      30000 // 30 segundos de timeout para arquivos grandes
    );

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.message || "Failed to upload file.");
    }

    const result = await response.json();
    const timeElapsed = Date.now() - startTime;
    
    if (result.isMock) {
      console.warn(`⚠️ AVISO: Usando URL placeholder (${timeElapsed}ms). Supabase Storage não está configurado!`);
      console.warn(`⚠️ Acesse https://supabase.com/docs/guides/storage/quickstart para configurar o armazenamento.`);
    } else {
      console.log(`Upload concluído em ${timeElapsed}ms. URL: ${result.url}`);
    }

    // A resposta da API do Vercel Blob contém a URL do arquivo
    return {
      file_url: result.url,
      isMock: result.isMock
    };
  } catch (error) {
    console.error(`Erro no upload: ${error.message}`);
    if (error.name === 'AbortError') {
      throw new Error('O upload demorou muito tempo e foi cancelado.');
    }
    throw error;
  }
};