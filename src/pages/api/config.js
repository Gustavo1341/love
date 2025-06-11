import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

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