// src/integrations/Core.js

// Função helper para timeout
const fetchWithTimeout = async (url, options = {}, timeoutMs = 30000) => {
  console.log(`Iniciando fetch para ${url} com timeout de ${timeoutMs}ms`);
  const controller = new AbortController();
  const id = setTimeout(() => {
    console.warn(`Timeout de ${timeoutMs}ms atingido para ${url}`);
    controller.abort();
  }, timeoutMs);
  
  try {
    // Mesclando o signal do controller com qualquer signal existente nas options
    const signal = controller.signal;
    const response = await fetch(url, {
      ...options,
      signal
    });
    console.log(`Fetch para ${url} concluído com status ${response.status}`);
    return response;
  } finally {
    clearTimeout(id);
  }
};

export const UploadFile = async ({ file, params = {} }) => {
  if (!file) {
    throw new Error("No file provided to UploadFile function.");
  }
  
  console.log(`Iniciando upload do arquivo: ${file.name} (${file.size} bytes)`);
  const startTime = Date.now();

  // Número máximo de tentativas
  const maxRetries = 3;
  // Timeout progressivo
  const timeoutBase = 30000; // 30 segundos base
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Construir URL com parâmetros adicionais
      // Usamos window.location.origin para garantir que a URL base está correta, mesmo em produção
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      let uploadUrl = `${baseUrl}/api/upload?filename=${encodeURIComponent(file.name)}`;
      
      // Adicionar parâmetros extras à URL
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          uploadUrl += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
      });
      
      // Aumentamos o timeout a cada tentativa
      const currentTimeout = timeoutBase * attempt;
      
      console.log(`Tentativa ${attempt}/${maxRetries} para ${uploadUrl} (timeout: ${currentTimeout}ms)`);
      
      const response = await fetchWithTimeout(
        uploadUrl,
        {
          method: 'POST',
          body: file,
          // Adicionamos cabeçalhos para evitar cache
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Retry-Attempt': `${attempt}`
          }
        },
        currentTimeout // timeout específico para esta tentativa
      );

      // Se a resposta não é JSON válido, trate o erro
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error(`Erro ao processar resposta JSON (tentativa ${attempt}):`, jsonError);
        
        // Se é a última tentativa, criamos uma resposta fallback
        if (attempt === maxRetries) {
          return {
            file_url: `https://placehold.co/600x400?text=Error:${encodeURIComponent(file.name)}`,
            isMock: true,
            error: 'Resposta inválida do servidor'
          };
        }
        
        // Se não é a última tentativa, continuamos para a próxima
        lastError = new Error('Resposta inválida do servidor');
        continue;
      }

      // Mesmo que tenha um erro, se tiver URL, use-a
      if (result && result.url) {
        const timeElapsed = Date.now() - startTime;
        
        if (result.isMock) {
          console.warn(`⚠️ AVISO: Usando URL placeholder (${timeElapsed}ms). Supabase Storage não está configurado!`);
          console.warn(`⚠️ Acesse https://supabase.com/docs/guides/storage/quickstart para configurar o armazenamento.`);
        } else {
          console.log(`Upload concluído em ${timeElapsed}ms (tentativa ${attempt}/${maxRetries}). URL: ${result.url}`);
        }

        // A resposta da API contém a URL do arquivo
        return {
          file_url: result.url,
          isMock: result.isMock,
          success: result.success,
          photo_id: result.photo_id,
          is_registered_in_db: result.is_registered_in_db
        };
      }
      
      // Se chegou aqui, não temos URL mas não há erro explícito
      lastError = new Error(result.error || 'Erro desconhecido no upload');
      
      // Se é a última tentativa, lançamos o erro
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Esperamos um pouco antes da próxima tentativa (backoff exponencial)
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Aguardando ${backoffMs}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
    } catch (error) {
      console.error(`Erro no upload (tentativa ${attempt}/${maxRetries}):`, error.message);
      
      lastError = error;
      
      // Se é timeout ou erro de conexão, tentamos novamente
      const isNetworkError = error.name === 'AbortError' || 
                            error.message.includes('network') ||
                            error.message.includes('abort');
                            
      if (isNetworkError && attempt < maxRetries) {
        // Esperamos um pouco antes da próxima tentativa (backoff exponencial)
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Erro de rede. Aguardando ${backoffMs}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
      
      // Se chegou aqui na última tentativa, retornamos o fallback
      if (attempt === maxRetries) {
        return {
          file_url: `https://placehold.co/600x400?text=Error:${encodeURIComponent(file.name)}`,
          isMock: true,
          error: error.message,
          attempts: attempt
        };
      }
    }
  }
  
  // Se chegou aqui é porque todas as tentativas falharam
  console.error(`Todas as ${maxRetries} tentativas falharam para o upload de ${file.name}`);
  return {
    file_url: `https://placehold.co/600x400?text=Failed:${encodeURIComponent(file.name)}`,
    isMock: true,
    error: lastError ? lastError.message : 'Múltiplas falhas de upload',
    attempts: maxRetries
  };
};