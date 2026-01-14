/**
 * Smart Text Chunker для быстрой разбивки больших текстов
 * Без тяжелых NLP библиотек, на regex + эвристиках
 */

// Regex для разделения на предложения
const SENTENCE_SPLIT_RE = /(?<=[.!?])\s+/;

/**
 * Разделяет текст на предложения
 */
export function splitIntoSentences(text: string): string[] {
  return text.trim().split(SENTENCE_SPLIT_RE).filter(s => s.length > 0);
}

/**
 * Умное чанкирование текста с учетом границ предложений
 * @param text - исходный текст
 * @param maxChars - максимум символов в чанке (по умолчанию 3500)
 * @param overlapSentences - количество предложений для overlap (по умолчанию 1)
 */
export function smartChunk(
  text: string,
  maxChars: number = 3500,
  overlapSentences: number = 1
): string[] {
  const sentences = splitIntoSentences(text);
  const chunks: string[] = [];

  let current: string[] = [];
  let currentLen = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sLen = sentence.length;

    if (currentLen + sLen <= maxChars) {
      current.push(sentence);
      currentLen += sLen;
    } else {
      // Сохраняем текущий чанк
      if (current.length > 0) {
        chunks.push(current.join(' '));
      }

      // Создаем overlap для консистентности
      const overlap = overlapSentences > 0 
        ? current.slice(-overlapSentences) 
        : [];
      
      current = [...overlap, sentence];
      currentLen = current.reduce((sum, s) => sum + s.length, 0);
    }
  }

  // Добавляем последний чанк
  if (current.length > 0) {
    chunks.push(current.join(' '));
  }

  return chunks;
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
