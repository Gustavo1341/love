import { put } from '@vercel/blob';

/*
export const config = {
  runtime: 'edge',
};
*/

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
    
    const blob = await put(filename, request.body, {
      access: 'public',
    });
    
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