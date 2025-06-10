import { createClient } from '@supabase/supabase-js';

// A API irá ler as variáveis de ambiente configuradas pela integração da Vercel
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

console.log('API inicializada. Verificando variáveis de ambiente:');
console.log('SUPABASE_URL definida:', !!supabaseUrl);
console.log('SUPABASE_ANON_KEY definida:', !!supabaseKey);

// IMPORTANTE: O cliente é criado FORA da função handler para ser reutilizado
// entre as requisições - melhora substancialmente a performance
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Evita problemas de sessão em funções serverless
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

/*
export const config = {
  runtime: 'edge',
};
*/

async function handler(request) {
  console.log(`[${new Date().toISOString()}] Requisição recebida: ${request.method}`);
  const startTime = Date.now();
  
  try {
    if (request.method === 'GET') {
      console.log('Buscando configuração no Supabase...');
      const { data, error } = await supabase
        .from('couple_config')
        .select('*')
        .limit(1)
        .single(); // .single() retorna um objeto só, ou null se não achar

      console.log('Resposta do Supabase:', { data: !!data, error });
      
      if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row not found"
        throw error;
      }

      const endTime = Date.now();
      console.log(`Requisição GET processada em ${endTime - startTime}ms`);
      
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } else if (request.method === 'POST') {
      console.log('Processando requisição POST...');
      const config = await request.json();
      console.log('Dados recebidos:', config);
      const { id, ...updateData } = config;

      let responseData;
      
      if (id) {
        // Atualiza a configuração existente
        console.log(`Atualizando registro com ID ${id}`);
        const { data, error } = await supabase
          .from('couple_config')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        console.log('Atualização concluída com sucesso');

      } else {
        // Cria uma nova configuração
        console.log('Criando novo registro');
        const { data, error } = await supabase
          .from('couple_config')
          .insert(updateData)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        console.log('Novo registro criado com sucesso');
      }

      const endTime = Date.now();
      console.log(`Requisição POST processada em ${endTime - startTime}ms`);

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