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

export default async function handler(request) {
  console.log(`[${new Date().toISOString()}] Upload API iniciada`);
  const startTime = Date.now();
  
  console.log("Upload function started.");

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    console.log("Erro: Filename ou body ausente");
    return new Response(JSON.stringify({ message: 'No filename provided.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log(`Attempting to upload file: ${filename}`);
    console.log("Iniciando upload para o Vercel Blob...");
    
    // Adicionando um timeout de 20 segundos para o upload
    // Isso evita que a função fique pendurada por muito tempo
    const blob = await Promise.race([
      put(filename, request.body, {
        access: 'public',
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout after 20s')), 20000)
      )
    ]);
    
    console.log("File uploaded successfully:", blob.url);
    const endTime = Date.now();
    console.log(`Upload concluído em ${endTime - startTime}ms`);

    return new Response(JSON.stringify(blob), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('UPLOAD_API_ERROR:', error);
    console.error('Erro detalhado:', JSON.stringify(error, null, 2));
    return new Response(JSON.stringify({ message: 'Error uploading file.', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 