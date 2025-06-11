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

export default async function handler(request) {
  const { method, body, url } = request;
  const { searchParams } = new URL(url);
  const id = searchParams.get('id');

  try {
    switch (method) {
      case 'GET':
        let query = supabase.from('couple_config').select(`
          *,
          photos: couple_photos (
            *,
            photo: photos (*)
          )
        `);
        
        if (id) {
          query = query.eq('id', id).single();
        } else {
          // Por padrão, retorna o primeiro (e único) registro
          query = query.limit(1).single();
        }

        const { data: getData, error: getError } = await query;

        if (getError && getError.code !== 'PGRST116') { // Ignora erro de "nenhum resultado"
          console.error('Erro ao buscar configuração:', getError);
          throw getError;
        }
        
        // Formata os dados para o cliente
        const formattedData = getData ? {
          ...getData,
          photos: getData.photos?.map(p => ({
            id: p.photo.id,
            url: p.photo.public_url,
            caption: p.photo.caption,
            display_order: p.display_order
          })).sort((a,b) => a.display_order - b.display_order) || []
        } : null;

        return new Response(JSON.stringify(id ? formattedData : [formattedData].filter(Boolean)), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'POST':
        const createData = typeof body === 'string' ? JSON.parse(body) : body;
        
        // Remove o campo 'photos' se ele existir, pois ele é gerenciado separadamente
        if ('photos' in createData) {
          delete createData.photos;
        }

        const { data: postData, error: postError } = await supabase
          .from('couple_config')
          .insert(createData)
          .select()
          .single();

        if (postError) {
          console.error('Erro ao criar configuração:', postError);
          throw postError;
        }
        return new Response(JSON.stringify(postData), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'PUT':
        if (!id) {
          return new Response(JSON.stringify({ message: 'ID é obrigatório para atualização' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const updateData = typeof body === 'string' ? JSON.parse(body) : body;
        
        // Remove o campo 'photos' se ele existir
        if ('photos' in updateData) {
            delete updateData.photos;
        }

        const { data: putData, error: putError } = await supabase
          .from('couple_config')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (putError) {
          console.error('Erro ao atualizar configuração:', putError);
          throw putError;
        }
        return new Response(JSON.stringify(putData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({ message: 'Método não permitido' }), {
          status: 405,
          headers: { 'Allow': 'GET, POST, PUT' },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 