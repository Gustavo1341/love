import { createClient } from '@supabase/supabase-js';

/*
export const config = {
  runtime: 'edge',
};
*/

// Inicializando o cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

  // Verificar se o Supabase está configurado
  const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey;
  console.log(`Supabase configurado: ${isSupabaseConfigured}`);

  try {
    console.log(`Iniciando upload do arquivo: "${filename}"`);
    
    let url;
    
    if (isSupabaseConfigured) {
      // Converter o corpo da requisição em um ArrayBuffer
      const arrayBuffer = await request.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Definir o tipo de arquivo (bucket) com base na extensão
      const fileExtension = filename.split('.').pop().toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
      const bucketName = isImage ? 'photos' : 'music';
      
      // Fazer upload para o Supabase Storage
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .upload(`uploads/${Date.now()}_${filename}`, buffer, {
          contentType: request.headers.get('content-type') || 'application/octet-stream',
          upsert: false
        });
      
      if (error) {
        throw new Error(`Erro no upload para o Supabase: ${error.message}`);
      }
      
      // Obter a URL pública do arquivo
      const { data: urlData } = supabase
        .storage
        .from(bucketName)
        .getPublicUrl(data.path);
      
      url = urlData.publicUrl;
    } else {
      // Alternativa: Vamos usar uma URL de placeholder para teste
      // No ambiente real, você precisará configurar o Supabase
      console.log("AVISO: Supabase não configurado para Storage! Usando URL de placeholder");
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
      isMock: !isSupabaseConfigured
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