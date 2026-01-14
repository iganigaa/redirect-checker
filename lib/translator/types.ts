/**
 * Типы для переводчика
 */

export interface AIModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  provider: string;
}

export interface TranslateRequest {
  text: string;
  fromLang?: string;
  toLang?: string;
  maxParallel?: number;
  model?: string;
  apiKey?: string;  // Опциональный API ключ от пользователя
}

export interface TranslateResponse {
  success: boolean;
  result?: string;
  error?: string;
  stats?: {
    originalLength: number;
    translatedLength: number;
    chunksCount: number;
    estimatedTokens: number;
    processingTime: number;
  };
}

export interface ChunkInfo {
  index: number;
  text: string;
  length: number;
}
