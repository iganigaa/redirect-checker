import { NextRequest, NextResponse } from 'next/server';
import { smartChunk, mergeChunks, estimateTokens } from '@/lib/translator/chunker';
import { translateChunks } from '@/lib/translator/openrouter';
import type { TranslateRequest, TranslateResponse } from '@/lib/translator/types';

export const maxDuration = 300; // 5 минут для больших текстов

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Получаем данные из запроса
    const body: TranslateRequest = await request.json();
    const { text, fromLang = 'English', toLang = 'Russian', maxParallel = 5 } = body;

    // Валидация
    if (!text || text.trim().length === 0) {
      return NextResponse.json<TranslateResponse>({
        success: false,
        error: 'Текст не может быть пустым'
      }, { status: 400 });
    }

    // Проверяем наличие API ключа
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json<TranslateResponse>({
        success: false,
        error: 'API ключ не настроен'
      }, { status: 500 });
    }

    // Чанкирование текста
    const chunks = smartChunk(text, 3500, 1);
    
    console.log(`[Translator] Processing ${chunks.length} chunks, ~${estimateTokens(text)} tokens`);

    // Параллельный перевод всех чанков
    const translatedChunks = await translateChunks(
      chunks,
      apiKey,
      { fromLang, toLang },
      maxParallel
    );

    // Склейка результата
    const result = mergeChunks(translatedChunks);
    const processingTime = Date.now() - startTime;

    console.log(`[Translator] Completed in ${processingTime}ms`);

    // Возвращаем результат
    return NextResponse.json<TranslateResponse>({
      success: true,
      result,
      stats: {
        originalLength: text.length,
        translatedLength: result.length,
        chunksCount: chunks.length,
        estimatedTokens: estimateTokens(text),
        processingTime
      }
    });

  } catch (error) {
    console.error('[Translator] Error:', error);
    
    return NextResponse.json<TranslateResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Произошла ошибка при переводе'
    }, { status: 500 });
  }
}
