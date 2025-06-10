import { createClient } from '@supabase/supabase-js';

/*
export const config = {
  runtime: 'edge',
};
*/

// Inicializando o cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  }
});

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
  console.log(`URL: ${supabaseUrl ? 'Definida' : 'Não definida'}`);
  console.log(`Key: ${supabaseKey ? 'Definida' : 'Não definida'}`);

  try {
    console.log(`Iniciando upload do arquivo: "${filename}"`);
    
    let url;
    
    if (isSupabaseConfigured) {
      try {
        // Converter o corpo da requisição em um ArrayBuffer
        const arrayBuffer = await request.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Definir o tipo de arquivo (bucket) com base na extensão
        const fileExtension = filename.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
        const bucketName = isImage ? 'photos' : 'music';
        
        console.log(`Bucket selecionado: ${bucketName}`);
        console.log(`Tamanho do arquivo: ${buffer.length} bytes`);
        
        // Verificando se o bucket existe
        const { data: buckets, error: bucketError } = await supabase
          .storage
          .listBuckets();
          
        if (bucketError) {
          console.error(`Erro ao listar buckets: ${bucketError.message}`);
          throw new Error(`Erro ao listar buckets: ${bucketError.message}`);
        }
        
        const bucketExists = buckets.some(b => b.name === bucketName);
        if (!bucketExists) {
          console.log(`Bucket '${bucketName}' não existe. Usando placeholder.`);
          throw new Error(`Bucket '${bucketName}' não existe no Supabase Storage.`);
        }
        
        // Fazer upload para o Supabase Storage
        const { data, error } = await supabase
          .storage
          .from(bucketName)
          .upload(`uploads/${Date.now()}_${filename}`, buffer, {
            contentType: request.headers.get('content-type') || 'application/octet-stream',
            upsert: false
          });
        
        if (error) {
          console.error(`Erro no upload para o Supabase: ${error.message}`);
          throw new Error(`Erro no upload para o Supabase: ${error.message}`);
        }
        
        // Obter a URL pública do arquivo
        const { data: urlData } = supabase
          .storage
          .from(bucketName)
          .getPublicUrl(data.path);
        
        url = urlData.publicUrl;
      } catch (supabaseError) {
        console.error('Erro específico do Supabase:', supabaseError);
        // Cai no fallback se houver qualquer erro com o Supabase
        throw supabaseError;
      }
    } 
    
    // Se chegou aqui sem URL definida, é porque o Supabase falhou ou não está configurado
    if (!url) {
      // Alternativa: Vamos usar uma URL de placeholder para teste
      console.log("AVISO: Usando URL de placeholder devido a erro ou falta de configuração do Supabase");
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
      isMock: !url.includes(supabaseUrl)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ERRO NO UPLOAD:', error.message);
    console.error('Stack:', error.stack);
    
    // Vamos criar um URL de fallback para não bloquear o usuário
    const fileType = filename.split('.').pop().toLowerCase();
    let fallbackUrl;
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      fallbackUrl = `https://placehold.co/600x400?text=Error:${encodeURIComponent(filename)}`;
    } else if (['mp3', 'wav', 'ogg'].includes(fileType)) {
      fallbackUrl = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav';
    } else {
      fallbackUrl = `https://example.com/error_${filename}`;
    }
    
    // 4. Retornar mensagem de erro detalhada, mas com URL de fallback
    return new Response(JSON.stringify({ 
      url: fallbackUrl,
      success: false,
      isMock: true,
      error: error.message
    }), {
      status: 200, // Usamos 200 mesmo com erro para que o frontend possa processar
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 