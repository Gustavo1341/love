import { createClient } from '@supabase/supabase-js';

// A configuração de runtime agora é gerenciada pelo vercel.json

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// No Edge, é melhor instanciar o cliente dentro do handler se as variáveis de ambiente
// puderem mudar, ou se houver preocupações com o escopo global.
// Para simplicidade e performance, mantemos fora, mas cientes do ambiente.
const supabase = createClient(supabaseUrl, supabaseKey);

async function handler(request) {
  const { method } = request;
  const startTime = Date.now();
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Edge API] /api/config: Variáveis de ambiente do Supabase não estão configuradas.');
    return new Response(JSON.stringify({ message: 'A configuração do servidor está incompleta.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`[Edge API] /api/config received ${method} request.`);

  try {
    if (method === 'GET') {
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
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row not found"
        console.error('Supabase GET error:', error.message);
        throw error;
      }
      
      // Formata os dados para o cliente
      const formattedData = data ? {
        ...data,
        photos: data.photos.map(p => ({
          id: p.photo.id,
          url: p.photo.public_url,
          caption: p.photo.caption
        }))
      } : null;

      console.log(`[Edge API] GET /api/config success in ${Date.now() - startTime}ms.`);
      return new Response(JSON.stringify(formattedData || null), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json', 
          'Cache-Control': 'no-cache, no-store, must-revalidate' 
        },
      });

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
          .single();
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
          .single();
        if (error) {
          console.error('Supabase POST (create) error:', error.message);
          throw error;
        }
        responseData = data;
      }

      console.log(`[Edge API] POST /api/config success in ${Date.now() - startTime}ms.`);
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { 
        status: 405, 
        headers: { 'Allow': 'GET, POST' } 
      });
    }
  } catch (error) {
    console.error(`[Edge API] /api/config error: ${error.message}`);
    return new Response(JSON.stringify({ message: error.message || 'An unknown error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default handler; 