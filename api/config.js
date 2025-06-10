import { createClient } from '@supabase/supabase-js';

// A configuração de runtime agora é gerenciada pelo vercel.json

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Cria um cliente Supabase com timeout reduzido para evitar que a função atinja o limite da Vercel
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
  global: {
    // Define um timeout mais curto para as requisições Supabase
    // para evitar o timeout de 60s da Vercel
    fetch: (url, options) => {
      const controller = new AbortController();
      const { signal } = controller;
      
      // Timeout de 10 segundos para requisições ao Supabase
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      return fetch(url, { ...options, signal })
        .then(response => {
          clearTimeout(timeoutId);
          return response;
        })
        .catch(error => {
          clearTimeout(timeoutId);
          throw error;
        });
    }
  }
});

// Dados padrão para caso de timeout ou erro
const DEFAULT_CONFIG = {
  couple_name: "Seu & Amor",
  relationship_start: new Date().toISOString(),
  custom_phrase: "Nossa história está apenas começando...",
  photos: []
};

async function handler(request) {
  const { method } = request;
  const startTime = Date.now();

  console.log(`[Edge API] /api/config received ${method} request. (${startTime})`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Edge API] /api/config: Variáveis de ambiente do Supabase não estão configuradas.');
    return new Response(JSON.stringify(DEFAULT_CONFIG), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-Config-Source': 'default-no-env'
      },
    });
  }

  // Implementa um timeout para toda a função
  const responsePromise = handleRequest(request, method, startTime);
  
  // Força a resposta após 50 segundos para evitar o timeout de 60s da Vercel
  const timeoutPromise = new Promise(resolve => {
    setTimeout(() => {
      console.error(`[Edge API] Timeout forçado após ${Date.now() - startTime}ms. Enviando dados padrão.`);
      resolve(new Response(JSON.stringify(DEFAULT_CONFIG), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-Config-Source': 'timeout-fallback' 
        },
      }));
    }, 50000); // 50 segundos, dando 10s de margem
  });

  // Retorna o que terminar primeiro: a requisição normal ou o timeout
  return Promise.race([responsePromise, timeoutPromise]);
}

async function handleRequest(request, method, startTime) {
  try {
    if (method === 'GET') {
      // Primeira tentativa: Buscar com o join (mais completo, mas pode ser mais lento)
      try {
        const { data, error } = await supabase
          .from('couple_config')
          .select(`
            *,
            photos:couple_photos(
              photo:photo_id(
                id,
                public_url,
                caption
              )
            )
          `)
          .limit(1)
          .single()
          .timeout(8000); // 8 segundos máximos para esta query

        if (!error) {
          // Formata os dados para o cliente
          const formattedData = data ? {
            ...data,
            photos: data.photos.map(p => ({
              id: p.photo.id,
              url: p.photo.public_url,
              caption: p.photo.caption
            }))
          } : null;

          console.log(`[Edge API] GET /api/config success (join query) in ${Date.now() - startTime}ms.`);
          return new Response(JSON.stringify(formattedData || DEFAULT_CONFIG), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json', 
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Config-Source': data ? 'full-join-query' : 'default-no-data'
            },
          });
        }
        
        console.warn(`[Edge API] GET /api/config join query failed: ${error.message}. Tentando consulta simples...`);
      } catch (joinError) {
        console.warn(`[Edge API] GET /api/config join query error: ${joinError.message}. Tentando consulta simples...`);
      }
      
      // Segunda tentativa: Buscar apenas a config (mais rápido, sem fotos)
      try {
        const { data, error } = await supabase
          .from('couple_config')
          .select('*')
          .limit(1)
          .single()
          .timeout(5000); // 5 segundos máximos para esta query simples

        if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row not found"
          console.error('Supabase simple GET error:', error.message);
          throw error;
        }
        
        console.log(`[Edge API] GET /api/config success (simple query) in ${Date.now() - startTime}ms.`);
        return new Response(JSON.stringify(data || DEFAULT_CONFIG), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json', 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Config-Source': data ? 'simple-query' : 'default-no-data'
          },
        });
      } catch (simpleError) {
        console.error(`[Edge API] GET /api/config simple query error: ${simpleError.message}`);
        throw simpleError;
      }

    } else if (method === 'POST') {
      const config = await request.json();
      const { id, ...updateData } = config;

      // Não salvamos as fotos diretamente aqui, isso é feito em outro lugar
      delete updateData.photos;

      let responseData;
      
      if (id) {
        // Atualiza
        const { data, error } = await supabase
          .from('couple_config')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()
          .timeout(15000); // 15s timeout para operações de escrita
          
        if (error) {
           console.error('Supabase POST (update) error:', error.message);
           throw error;
        }
        responseData = data;
      } else {
        // Cria
        const { data, error } = await supabase
          .from('couple_config')
          .insert(updateData)
          .select()
          .single()
          .timeout(15000); // 15s timeout para operações de escrita
          
        if (error) {
          console.error('Supabase POST (create) error:', error.message);
          throw error;
        }
        responseData = data;
      }

      console.log(`[Edge API] POST /api/config success in ${Date.now() - startTime}ms.`);
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-Config-Source': 'post-success'
        },
      });

    } else {
      return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { 
        status: 405, 
        headers: { 'Allow': 'GET, POST' } 
      });
    }
  } catch (error) {
    console.error(`[Edge API] /api/config error after ${Date.now() - startTime}ms: ${error.message}`);
    
    // Dados padrão em caso de erro
    return new Response(JSON.stringify(DEFAULT_CONFIG), {
      status: 200, // Retorna 200 com dados padrão em vez de 500
      headers: { 
        'Content-Type': 'application/json',
        'X-Config-Source': 'error-fallback'
      },
    });
  }
}

export default handler; 