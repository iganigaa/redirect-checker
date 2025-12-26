// Available AI models for price extraction and matching
export const AVAILABLE_MODELS = [
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Рекомендуется - Быстрый и дешёвый)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Бесплатный)' },
  { id: 'openai/gpt-4o', name: 'GPT-4o (Качество, но дорого)' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Качество, но дорого)' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B (Open Source)' },
];

export const DEFAULT_MODEL = 'deepseek/deepseek-chat';

// Determine API endpoint based on key prefix
export function getAPIConfig(apiKey: string, selectedModel?: string): { endpoint: string; model: string } {
  const model = selectedModel || DEFAULT_MODEL;
  
  if (apiKey.startsWith('sk-or-')) {
    return {
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: model
    };
  }
  
  // For OpenAI keys, use gpt-4o
  return {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o'
  };
}

