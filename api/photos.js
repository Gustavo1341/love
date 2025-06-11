import { createClient } from '@supabase/supabase-js';

// Inicializando o cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
  // Definir um timeout mais curto para falhar rápido se houver problemas
  global: {
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000); // 7 segundos de timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => clearTimeout(timeout));
    }
  }
});

export default async function handler(request) {
  console.log(`[${new Date().toISOString()}] Photos API iniciada: ${request.method}`);
  const startTime = Date.now();
  
  try {
    // GET - Listar fotos
    if (request.method === 'GET') {
      console.log('Buscando lista de fotos');
      
      // Opcionalmente filtra por ID de configuração do casal
      const { searchParams } = new URL(request.url);
      const coupleConfigId = searchParams.get('couple_config_id');
      
      let query;
      
      if (coupleConfigId) {
        // Busca fotos relacionadas a uma configuração específica
        // Certifique-se de que o ID seja tratado como número
        const configIdNum = parseInt(coupleConfigId, 10);
        
        if (isNaN(configIdNum)) {
          return new Response(JSON.stringify({ 
            message: 'ID de configuração inválido. Deve ser um número.' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        const { data, error } = await supabase
          .from('couple_photos')
          .select(`
            id,
            display_order,
            photo:photo_id(
              id,
              public_url,
              caption,
              mime_type,
              created_at
            )
          `)
          .eq('couple_config_id', configIdNum)
          .order('display_order');
          
        if (error) throw error;
        
        // Transforma a resposta em um formato mais limpo
        const photos = data.map(item => ({
          id: item.photo.id,
          url: item.photo.public_url,
          caption: item.photo.caption || '',
          display_order: item.display_order,
          mime_type: item.photo.mime_type,
          created_at: item.photo.created_at
        }));
        
        console.log(`Encontradas ${photos.length} fotos para o casal`);
        return new Response(JSON.stringify(photos), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        // Lista todas as fotos (sem filtro)
        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        console.log(`Encontradas ${data.length} fotos no total`);
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // POST - Registrar uma nova foto
    else if (request.method === 'POST') {
      const payload = await request.json();
      console.log('Registrando nova foto:', payload);
      
      const { public_url, file_path, caption, mime_type, size_bytes, couple_config_id } = payload;
      
      if (!public_url || !file_path) {
        return new Response(JSON.stringify({ 
          message: 'URL pública e caminho do arquivo são obrigatórios' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // 1. Registra a foto
      const { data: photo, error: photoError } = await supabase
        .from('photos')
        .insert({
          public_url,
          file_path,
          caption,
          mime_type,
          size_bytes
        })
        .select()
        .single();
        
      if (photoError) throw photoError;
      
      // 2. Se tiver um couple_config_id, relaciona a foto com a configuração
      if (couple_config_id) {
        // Certifique-se de que o ID seja tratado como número
        const configIdNum = parseInt(couple_config_id, 10);
        
        if (isNaN(configIdNum)) {
          console.warn('ID de configuração inválido, não será relacionado:', couple_config_id);
        } else {
          // Conta quantas fotos já existem para definir a ordem
          const { count, error: countError } = await supabase
            .from('couple_photos')
            .select('*', { count: 'exact', head: true })
            .eq('couple_config_id', configIdNum);
            
          if (countError) throw countError;
          
          // Adiciona relacionamento
          const { error: relationError } = await supabase
            .from('couple_photos')
            .insert({
              couple_config_id: configIdNum,
              photo_id: photo.id,
              display_order: count || 0
            });
            
          if (relationError) throw relationError;
        }
      }
      
      console.log(`Foto registrada com sucesso. ID: ${photo.id}`);
      return new Response(JSON.stringify(photo), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // DELETE - Remover uma foto
    else if (request.method === 'DELETE') {
      const { searchParams } = new URL(request.url);
      const photoId = searchParams.get('id');
      
      if (!photoId) {
        return new Response(JSON.stringify({ message: 'ID da foto é obrigatório' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Certifique-se de que o ID seja tratado como número
      const photoIdNum = parseInt(photoId, 10);
      
      if (isNaN(photoIdNum)) {
        return new Response(JSON.stringify({ 
          message: 'ID da foto inválido. Deve ser um número.' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // 1. Obter o caminho do arquivo para poder excluí-lo do storage também
      const { data: photo, error: getError } = await supabase
        .from('photos')
        .select('file_path')
        .eq('id', photoIdNum)
        .single();
        
      if (getError && getError.code !== 'PGRST116') throw getError;
      
      // 2. Excluir a foto do banco
      const { error: deleteError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoIdNum);
        
      if (deleteError) throw deleteError;
      
      // 3. Se encontrou o caminho do arquivo, tenta excluir do storage também
      if (photo && photo.file_path) {
        const bucketName = 'photos'; // Bucket padrão para fotos
        const filePath = photo.file_path.replace(`${bucketName}/`, ''); // Remove o prefixo do bucket
        
        console.log(`Tentando excluir arquivo do storage: ${filePath}`);
        const { error: storageError } = await supabase
          .storage
          .from(bucketName)
          .remove([filePath]);
          
        if (storageError) {
          console.error('Erro ao excluir arquivo do storage:', storageError);
          // Não lançamos o erro para não interromper o fluxo, já que o registro já foi excluído do banco
        }
      }
      
      console.log(`Foto removida com sucesso. ID: ${photoIdNum}`);
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Foto removida com sucesso'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // PATCH - Atualizar informações de uma foto (ex: legenda)
    else if (request.method === 'PATCH') {
      const { searchParams } = new URL(request.url);
      const photoId = searchParams.get('id');
      
      if (!photoId) {
        return new Response(JSON.stringify({ message: 'ID da foto é obrigatório' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Certifique-se de que o ID seja tratado como número
      const photoIdNum = parseInt(photoId, 10);
      
      if (isNaN(photoIdNum)) {
         return new Response(JSON.stringify({ 
          message: 'ID da foto inválido. Deve ser um número.' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const payload = await request.json();
      const { caption } = payload;
      
      const { data, error } = await supabase
        .from('photos')
        .update({ caption })
        .eq('id', photoIdNum)
        .select()
        .single();
        
      if (error) throw error;
      
      console.log(`Legenda da foto atualizada com sucesso. ID: ${photoIdNum}`);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Se o método não for suportado
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Allow': 'GET, POST, DELETE, PATCH' },
    });
    
  } catch (error) {
    console.error('ERRO GERAL na API de Fotos:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    console.log(`Photos API finalizada em ${Date.now() - startTime}ms`);
  }
} 