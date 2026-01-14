/**
 * Понятные сообщения об ошибках для пользователей
 */

export function getErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();

  // Ошибки авторизации
  if (message.includes('401') || message.includes('unauthorized')) {
    return 'Неверный API ключ. Проверьте ключ на https://openrouter.ai/keys';
  }

  // Ошибки недостатка средств
  if (message.includes('insufficient') || message.includes('credits') || message.includes('balance')) {
    return 'Недостаточно средств на балансе OpenRouter. Пополните баланс на https://openrouter.ai/credits';
  }

  // Rate limit
  if (message.includes('429') || message.includes('rate limit')) {
    return 'Превышен лимит запросов. Подождите немного и попробуйте снова.';
  }

  // Timeout
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Превышено время ожидания. Попробуйте уменьшить размер текста или попробуйте позже.';
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch failed')) {
    return 'Ошибка сети. Проверьте подключение к интернету.';
  }

  // Empty response
  if (message.includes('empty response')) {
    return 'API вернул пустой ответ. Попробуйте другую модель или уменьшите размер текста.';
  }

  // JSON parsing errors
  if (message.includes('json') || message.includes('parse')) {
    return 'Ошибка обработки ответа API. Попробуйте другую модель.';
  }

  // Default
  return error.message || 'Неизвестная ошибка при переводе';
}
