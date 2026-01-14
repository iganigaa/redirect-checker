import { NextRequest, NextResponse } from 'next/server';
import { smartChunk, mergeChunks, estimateTokens } from '@/lib/translator/chunker';
import { translateChunks } from '@/lib/translator/openrouter';
import { getErrorMessage } from '@/lib/translator/errorMessages';
import type { TranslateRequest, TranslateResponse } from '@/lib/translator/types';

export const maxDuration = 300; // 5 минут для больших текстов

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Получаем данные из запроса
    const body: TranslateRequest = await request.json();
    const { 
      text, 
      fromLang = 'English', 
      toLang = 'Russian', 
      maxParallel = 5,
      model = 'deepseek/deepseek-chat',
      apiKey: userApiKey 
    } = body;

    // Валидация
    if (!text || text.trim().length === 0) {
      return NextResponse.json<TranslateResponse>({
        success: false,
        error: 'Текст не может быть пустым'
      }, { status: 400 });
    }

    // Проверяем наличие API ключа (серверный или пользовательский)
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json<TranslateResponse>({
        success: false,
        error: 'API ключ не настроен. Введите его в настройках или добавьте в переменные окружения.'
      }, { status: 400 });
    }

    // Проверяем формат API ключа
    if (!apiKey.startsWith('sk-or-')) {
      return NextResponse.json<TranslateResponse>({
        success: false,
        error: 'Неверный формат API ключа. Ключ должен начинаться с "sk-or-". Получите правильный ключ на https://openrouter.ai/keys'
      }, { status: 400 });
    }

    // Чанкирование текста (2500 символов для стабильности)
    const chunks = smartChunk(text, 2500);
    
    console.log(`[Translator] Processing ${chunks.length} chunks, ~${estimateTokens(text)} tokens`);
    console.log(`[Translator] Chunk sizes:`, chunks.map(c => c.length));

    // Последовательный перевод всех чанков (более надежно)
    const translatedChunks = await translateChunks(
      chunks,
      apiKey,
      { fromLang, toLang, model }
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
    
    // Более детальное логирование
    if (error instanceof Error) {
      console.error('[Translator] Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    // Получаем понятное сообщение об ошибке
    const errorMessage = error instanceof Error 
      ? getErrorMessage(error)
      : 'Произошла ошибка при переводе';
    
    return NextResponse.json<TranslateResponse>({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
