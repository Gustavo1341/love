import { createClient } from '@supabase/supabase-js';

// A API irá ler as variáveis de ambiente configuradas pela integração da Vercel
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

console.log('API inicializada. Verificando variáveis de ambiente:');
console.log(`Supabase URL configurada: ${supabaseUrl ? 'Sim' : 'Não'}`);
console.log(`Supabase Key configurada: ${supabaseKey ? 'Sim' : 'Não'}`);

// IMPORTANTE: O cliente é criado FORA da função handler para ser reutilizado
// entre as requisições - melhora substancialmente a performance
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Evita problemas de sessão em funções serverless
  },
  // Definir um timeout mais longo para operações de banco de dados
  global: {
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        console.warn(`Timeout de 15 segundos atingido para ${url}`);
        controller.abort();
      }, 15000); // 15 segundos de timeout
      
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
      
      // Implementação com retry
      const maxRetries = 3;
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Tentativa ${attempt}/${maxRetries} de buscar configuração`);
          
          const { data, error } = await supabase
            .from('couple_config')
            .select('*')
            .limit(1)
            .single(); // .single() retorna um objeto só, ou null se não achar
  
          console.log('Resposta do Supabase:', { data: !!data, error });
          
          if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row not found"
            // Se não é erro de "nenhum dado encontrado", consideramos um erro real
            if (attempt < maxRetries) {
              console.warn(`Erro na tentativa ${attempt}. Tentando novamente...`);
              lastError = error;
              
              // Espera um pouco antes de tentar novamente (backoff exponencial)
              const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
            throw error;
          }
  
          const endTime = Date.now();
          console.log(`Requisição GET processada em ${endTime - startTime}ms`);
          
          return new Response(JSON.stringify(data || {}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (retryError) {
          console.error(`Erro na tentativa ${attempt}:`, retryError);
          lastError = retryError;
          
          if (attempt < maxRetries) {
            // Espera um pouco antes de tentar novamente (backoff exponencial)
            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw retryError;
        }
      }
      
      // Se chegou aqui, todas as tentativas falharam
      throw lastError || new Error('Falha em todas as tentativas de buscar configuração');

    } else if (request.method === 'POST') {
      console.log('Processando requisição POST...');
      const config = await request.json();
      console.log('Dados recebidos:', config);
      const { id, ...updateData } = config;

      let responseData;
      
      // Implementação com retry
      const maxRetries = 3;
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Tentativa ${attempt}/${maxRetries} de salvar configuração`);
          
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
          
          // Se chegou aqui, a operação foi bem-sucedida
          break;
        } catch (retryError) {
          console.error(`Erro na tentativa ${attempt}:`, retryError);
          lastError = retryError;
          
          if (attempt < maxRetries) {
            // Espera um pouco antes de tentar novamente (backoff exponencial)
            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw retryError;
        }
      }

      const endTime = Date.now();
      console.log(`Requisição POST processada em ${endTime - startTime}ms`);
      
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ message: 'Método não suportado' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    
    // Enviamos uma resposta mais informativa
    return new Response(JSON.stringify({ 
      message: 'Erro ao processar requisição',
      error: error.message,
      code: error.code || 'UNKNOWN'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default handler; 