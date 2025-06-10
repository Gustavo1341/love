import { createClient } from '@supabase/supabase-js';

// A API irá ler as variáveis de ambiente configuradas pela integração da Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/*
export const config = {
  runtime: 'edge',
};
*/

async function handler(request) {
  try {
    if (request.method === 'GET') {
      const { data, error } = await supabase
        .from('couple_config')
        .select('*')
        .limit(1)
        .single(); // .single() retorna um objeto só, ou null se não achar

      if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row not found"
        throw error;
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } else if (request.method === 'POST') {
      const config = await request.json();
      const { id, ...updateData } = config;

      let responseData;
      
      if (id) {
        // Atualiza a configuração existente
        const { data, error } = await supabase
          .from('couple_config')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        responseData = data;

      } else {
        // Cria uma nova configuração
        const { data, error } = await supabase
          .from('couple_config')
          .insert(updateData)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
      }

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } else {
      return new Response('Method Not Allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Supabase API Error:', error);
    return new Response(JSON.stringify({ message: 'Server Error', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default handler; 