import { put } from '@vercel/blob';

/*
export const config = {
  runtime: 'edge',
};
*/

// Define um timeout para a operação de upload
const fetchWithTimeout = async (url, options, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
};

// Verificação para ver se o Vercel Blob está configurado
const isVercelBlobConfigured = () => {
  const storageConnectionString = process.env.BLOB_READ_WRITE_TOKEN;
  return !!storageConnectionString;
};

export default async function handler(request) {
  console.log(`[${new Date().toISOString()}] Upload API iniciada`);
  const startTime = Date.now();
  
  // 1. Validar a solicitação
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    console.log("Erro: Parâmetro filename não fornecido");
    return new Response(JSON.stringify({ message: 'Filename parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!request.body) {
    console.log("Erro: Corpo da requisição ausente");
    return new Response(JSON.stringify({ message: 'Request body is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verificar se o Vercel Blob está configurado
  const blobConfigured = isVercelBlobConfigured();
  console.log(`Vercel Blob configurado: ${blobConfigured}`);

  try {
    console.log(`Iniciando upload do arquivo: "${filename}"`);
    
    let url;
    
    if (blobConfigured) {
      // 2. Realizar o upload para o Vercel Blob
      const blob = await put(filename, request.body, {
        access: 'public',
      });
      url = blob.url;
    } else {
      // Alternativa: Vamos usar uma URL de placeholder para teste
      // No ambiente real, você precisará configurar o Vercel Blob
      console.log("AVISO: Vercel Blob não configurado! Usando URL de placeholder");
      const fileType = filename.split('.').pop().toLowerCase();
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
        // Placeholder para imagens
        url = `https://placehold.co/600x400?text=${encodeURIComponent(filename)}`;
      } else if (['mp3', 'wav', 'ogg'].includes(fileType)) {
        // Placeholder para áudio - usamos um MP3 público
        url = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav';
      } else {
        // Placeholder genérico
        url = `https://example.com/${filename}`;
      }
    }
    
    // 3. Retornar a resposta com a URL
    console.log(`Upload bem-sucedido: ${url}`);
    console.log(`Tempo total: ${Date.now() - startTime}ms`);
    
    return new Response(JSON.stringify({ 
      url: url,
      success: true,
      isMock: !blobConfigured
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ERRO NO UPLOAD:', error.message);
    console.error('Stack:', error.stack);
    
    // 4. Retornar mensagem de erro detalhada
    return new Response(JSON.stringify({ 
      message: 'Error uploading file',
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 