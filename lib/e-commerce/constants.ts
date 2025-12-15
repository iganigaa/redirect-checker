// This is the default template. The user can edit this in the UI.
export const DEFAULT_PROMPT_TEMPLATE = `
Used in {{niche}} placeholder
Used in {{role}} placeholder
[ХАРАКТЕРИСТИКИ ТОВАРА] {{attributes}}

---
### РОЛЬ
Ты — эксперт-практик ({{role}}). Твоя задача — написать продающее, технически грамотное описание товара для карточки интернет-магазина.
Текст должен быть полностью готов к публикации: без лишних слов, без нумерации блоков, без служебных заголовков.

### ПРАВИЛА ОБРАБОТКИ ДАННЫХ
1. Используй [ХАРАКТЕРИСТИКИ ТОВАРА].
2. Если данных мало, дополни их стандартами (ГОСТ/ISO) для этой категории.
3. Превращай сухие цифры в выгоды: "Характеристика → Условие → Польза".
4. Не используй воду ("лучший", "уникальный", "идеальный").

### КАТЕГОРИЧЕСКИЕ ЗАПРЕТЫ (ЭТО НЕЛЬЗЯ ВЫВОДИТЬ)
- ЗАПРЕЩЕНО выводить названия блоков (например, "1. Answer-First", "2. Технические характеристики", "3. Сценарии", "Комплектация и Call-to-Action").
- ЗАПРЕЩЕНО нумеровать разделы цифрами (1, 2, 3...).
- ЗАПРЕЩЕНО писать вступления ("Вот ваше описание", "Описание товара:").
- Твой ответ должен начинаться сразу с первого слова описания.

---
### СТРУКТУРА ГОТОВОГО ТЕКСТА (СТРОГО СЛЕДУЙ ЭТОМУ ПОРЯДКУ)

(Блок 1: Главное. Без заголовка)
Напиши 2-3 предложения. Сразу назови модель, её главную характеристику и для какой задачи она нужна. (Это тот самый Answer-First, но пиши сразу суть, без пометки).

## Характеристики
(Сразу под заголовком выведи Markdown-таблицу. 3 колонки: Характеристика | Значение | Практическая польза. Минимум 4 строки).

## Частые вопросы
(Напиши 3 пары "Вопрос-Ответ" для закрытия болей клиента. Вопросы выдели жирным).

## Важное ограничение
(Напиши 1 честное предупреждение: для чего товар НЕ подходит или где требует осторожности).

## Комплектация
(Перечисли, что входит в набор, и закончи текст одним призывом к действию, например: "Проверьте совместимость перед заказом").
`;

export const constructPrompt = (
  template: string, 
  niche: string, 
  role: string, 
  attributes: Record<string, string>
): string => {
  // Format attributes as a readable list text
  const attributesText = Object.entries(attributes)
    .filter(([key, value]) => value && value.trim() !== '') // skip empty
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  let prompt = template;
  
  // Replace placeholders
  // We use a fallback if the user leaves fields empty
  prompt = prompt.replace('{{role}}', role || 'Копирайтер-эксперт в e-commerce');
  prompt = prompt.replace('{{niche}}', niche || 'Розничная торговля');
  prompt = prompt.replace('{{attributes}}', attributesText);

  return prompt;
};

// Default model to use if none selected
export const DEFAULT_MODEL = 'deepseek/deepseek-chat';

export const AVAILABLE_MODELS = [
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Recommended, Fast & Cheap)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free Tier)' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B (Open Source)' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (High Quality, Expensive)' },
  { id: 'openai/gpt-4o', name: 'GPT-4o (High Quality, Expensive)' },
  { id: 'liquid/lfm-40b', name: 'Liquid LFM 40B (Efficient)' },
];

// Batch size for concurrent processing
export const BATCH_SIZE = 3; 
// Delay between batches in ms
export const BATCH_DELAY = 1000;

export const SYSTEM_PROMPT = "You are a professional copywriter for e-commerce.";




