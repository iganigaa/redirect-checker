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
  const { fromLang = 'English', toLang = 'Russian', temperature = 0.2 } = options;

  return {
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate from ${fromLang} to ${toLang}. Preserve meaning, structure, lists, headings, and formatting. Do not summarize. Do not omit anything. Maintain the original tone and style.`
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature
  };
}

/**
 * Переводит один чанк текста через OpenRouter
 */
export async function translateChunk(
  text: string, 
  apiKey: string,
  options: TranslationOptions = {}
): Promise<string> {
  const { temperature = 0.2, model = 'deepseek/deepseek-chat' } = options;
  
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
      'HTTP-Referer': 'https://igorburdukov.me', // Опционально для аналитики
      'X-Title': 'AI Translator'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Параллельный перевод нескольких чанков с ограничением concurrency
 */
export async function translateChunks(
  chunks: string[],
  apiKey: string,
  options: TranslationOptions = {},
  maxParallel: number = 5
): Promise<string[]> {
  const results: string[] = new Array(chunks.length);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const index = i;
    const promise = translateChunk(chunks[index], apiKey, options)
      .then(result => {
        results[index] = result;
      });

    executing.push(promise);

    // Ограничиваем количество параллельных запросов
    if (executing.length >= maxParallel) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === promise), 
        1
      );
    }
  }

  // Ждем завершения всех оставшихся запросов
  await Promise.all(executing);
  
  return results;
}
