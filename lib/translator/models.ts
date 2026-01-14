/**
 * Доступные модели для перевода через OpenRouter
 */

import { AIModel } from './types';

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    description: 'Рекомендуется. Быстрая и качественная модель',
    contextLength: 64000,
    provider: 'DeepSeek'
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    description: 'Reasoning модель для сложных переводов',
    contextLength: 64000,
    provider: 'DeepSeek'
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    description: 'Быстрая модель от Google',
    contextLength: 32000,
    provider: 'Google'
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Компактная версия GPT-4o',
    contextLength: 128000,
    provider: 'OpenAI'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Мощная модель от Anthropic',
    contextLength: 200000,
    provider: 'Anthropic'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    description: 'Open source модель от Meta',
    contextLength: 128000,
    provider: 'Meta'
  }
];

export const DEFAULT_MODEL_ID = 'deepseek/deepseek-chat';
