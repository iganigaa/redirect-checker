/**
 * OpenRouter Client для работы с AI моделями
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface TranslationOptions {
  fromLang?: string;
  toLang?: string;
  temperature?: number;
  model?: string;
}

/**
 * Создает промпт для перевода
 */
function buildPrompt(text: string, options: TranslationOptions = {}) {
  const { fromLang = 'English', toLang = 'Russian' } = options;

  return {
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text from ${fromLang} to ${toLang}. Do not summarize. Do not explain. Return ONLY the translated text. Preserve the original formatting and paragraph structure exactly. Translate ALL the text completely without omitting anything.`
      },
      {
        role: 'user',
        content: text
      }
    ]
  };
}

/**
 * Переводит один чанк текста через OpenRouter с retry логикой
 */
export async function translateChunk(
  text: string, 
  apiKey: string,
  options: TranslationOptions = {}
): Promise<string> {
  const { temperature = 0.3, model = 'deepseek/deepseek-chat' } = options;
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const payload = {
        model,
        ...buildPrompt(text, options),
        temperature
      };

      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://igorburdukov.me',
          'X-Title': 'AI Translator'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      attempt++;
      console.log(`[Translator] Retry attempt ${attempt} for chunk`);
      
      if (attempt >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  
  return "";
}

/**
 * Последовательный перевод всех чанков (более надежный способ)
 */
export async function translateChunks(
  chunks: string[],
  apiKey: string,
  options: TranslationOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`[Translator] Processing chunk ${i + 1} of ${chunks.length}`);
    
    if (onProgress) {
      onProgress(i + 1, chunks.length);
    }
    
    const translatedChunk = await translateChunk(chunks[i], apiKey, options);
    results.push(translatedChunk);
    
    // Небольшая пауза между запросами для стабильности
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}
