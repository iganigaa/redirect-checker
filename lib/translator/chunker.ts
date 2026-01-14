/**
 * Smart Text Chunker для разбивки больших текстов
 * Сохраняет структуру параграфов и предложений
 */

/**
 * Умное чанкирование текста с учетом границ параграфов и предложений
 * @param text - исходный текст
 * @param maxChunkSize - максимум символов в чанке (по умолчанию 2500)
 */
export function smartChunk(text: string, maxChunkSize: number = 2500): string[] {
  if (!text) return [];
  if (text.length <= maxChunkSize) return [text];

  const chunks: string[] = [];
  
  // Разбиваем по параграфам (двойные переносы строк)
  const paragraphs = text.split(/\n\n+/);
  
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    // Если добавление параграфа превысит лимит, сохраняем текущий чанк
    if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      // Обработка случая, когда один параграф больше maxChunkSize
      if (paragraph.length > maxChunkSize) {
        // Разбиваем параграф по предложениям
        const sentences = paragraph.match(/[^.!?]+[.!?]+(\s+|$)/g) || [paragraph];
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize) {
            if (currentChunk.length > 0) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
          } else {
            currentChunk += sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      // Добавляем параграф с двойным переносом
      currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
    }
  }

  // Добавляем последний чанк
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Разделяет текст на предложения (для совместимости)
 */
export function splitIntoSentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)/g);
  return sentences ? sentences.map(s => s.trim()).filter(s => s.length > 0) : [];
}

/**
 * Склейка переведенных чанков
 */
export function mergeChunks(chunks: string[]): string {
  return chunks.join('\n\n');
}

/**
 * Подсчет примерного количества токенов (грубая оценка)
 */
export function estimateTokens(text: string): number {
  // Примерно 4 символа = 1 токен для кириллицы
  return Math.ceil(text.length / 4);
}
