/**
 * Типы для переводчика
 */

export interface TranslateRequest {
  text: string;
  fromLang?: string;
  toLang?: string;
  maxParallel?: number;
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
