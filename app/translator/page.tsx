'use client';

import { useState, useEffect } from 'react';
import { 
  Languages, 
  Copy, 
  Trash2, 
  Home as HomeIcon, 
  ChevronRight, 
  Loader2, 
  Sparkles, 
  Settings, 
  Key,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { AVAILABLE_MODELS, DEFAULT_MODEL_ID } from '@/lib/translator/models';

interface TranslationState {
  status: 'idle' | 'translating' | 'completed' | 'error';
  progress: number;
  currentChunk: number;
  totalChunks: number;
  error?: string;
}

// Прямое обращение к OpenRouter API (как в референсе)
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Чанкирование (из референса)
function splitTextIntoChunks(text: string, maxChunkSize: number = 2500): string[] {
  if (!text) return [];
  if (text.length <= maxChunkSize) return [text];

  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      if (paragraph.length > maxChunkSize) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+(\s+|$)/g) || [paragraph];
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize) {
            if (currentChunk.length > 0) chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Перевод одного чанка (из референса)
async function translateChunk(
  text: string,
  modelId: string,
  apiKey: string,
  fromLang: string,
  toLang: string,
  onRetry: (attempt: number) => void
): Promise<string> {
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://igorburdukov.me',
          'X-Title': 'AI Translator',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following text from ${fromLang} to ${toLang}. Do not summarize. Do not explain. Return ONLY the translated text. Preserve the original formatting and paragraph structure exactly.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      attempt++;
      onRetry(attempt);
      if (attempt >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  return "";
}

export default function TranslatorPage() {
  const [apiKey, setApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  
  const [state, setState] = useState<TranslationState>({
    status: 'idle',
    progress: 0,
    currentChunk: 0,
    totalChunks: 0
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [fromLang, setFromLang] = useState('English');
  const [toLang, setToLang] = useState('Russian');

  const languages = ['English', 'Russian', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];

  // Load from localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('openrouter_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowSettings(true);
    }

    const storedModel = localStorage.getItem('selected_model');
    if (storedModel) {
      setSelectedModel(storedModel);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('openrouter_api_key', key);
    } else {
      localStorage.removeItem('openrouter_api_key');
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('selected_model', modelId);
  };

  // ГЛАВНАЯ ФУНКЦИЯ ПЕРЕВОДА (как в референсе)
  const startTranslation = async () => {
    if (!apiKey) {
      setShowSettings(true);
      showToastMessage('Введите API ключ в настройках');
      return;
    }
    if (!inputText.trim()) {
      showToastMessage('Введите текст для перевода!');
      return;
    }

    // Чанкирование
    const chunks = splitTextIntoChunks(inputText, 2500);
    const totalChunks = chunks.length;

    setState({
      status: 'translating',
      progress: 0,
      currentChunk: 0,
      totalChunks,
      error: undefined
    });

    const translatedParts: string[] = [];

    try {
      // Последовательный перевод (как в референсе)
      for (let i = 0; i < totalChunks; i++) {
        setState(prev => ({
          ...prev,
          currentChunk: i + 1,
          progress: Math.round(((i) / totalChunks) * 100)
        }));

        const translatedChunk = await translateChunk(
          chunks[i],
          selectedModel,
          apiKey,
          fromLang,
          toLang,
          (attempt) => console.log(`Retry attempt ${attempt} for chunk ${i + 1}`)
        );

        translatedParts.push(translatedChunk);
      }

      const fullTranslation = translatedParts.join('\n\n');
      setOutputText(fullTranslation);

      setState({
        status: 'completed',
        progress: 100,
        currentChunk: totalChunks,
        totalChunks
      });

      showToastMessage('Перевод выполнен!');
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err.message || 'Ошибка при переводе'
      }));
      showToastMessage(`Ошибка: ${err.message}`);
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      showToastMessage('Скопировано!');
    } catch (err) {
      showToastMessage('Ошибка копирования');
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setState({
      status: 'idle',
      progress: 0,
      currentChunk: 0,
      totalChunks: 0
    });
  };

  const swapLanguages = () => {
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
    const tempText = inputText;
    setInputText(outputText);
    setOutputText(tempText);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const selectedModelData = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="max-w-7xl mx-auto overflow-x-hidden">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link href="/" className="hover:text-purple-600 transition-colors">
          <HomeIcon className="w-4 h-4" />
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">AI Переводчик</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            AI Переводчик текстов
          </h1>
          <p className="text-gray-600 text-sm">
            Полный перевод больших текстов без сокращений
          </p>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            !apiKey 
              ? 'bg-red-100 text-red-600 border-2 border-red-300 animate-pulse' 
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Настройки</span>
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-lg border-2 border-purple-200 shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              Настройки API
            </h2>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenRouter API Key
              </label>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                🔒 Ваш ключ хранится локально в браузере. 
                <a 
                  href="https://openrouter.ai/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline ml-1"
                >
                  Получить ключ →
                </a>
              </p>
            </div>

            {apiKey && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>API ключ сохранен</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Model Selector */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Выбор AI модели</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {AVAILABLE_MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => handleModelChange(model.id)}
              disabled={state.status === 'translating'}
              className={`p-3 rounded-lg border-2 text-left transition-all text-sm ${
                selectedModel === model.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              } disabled:opacity-50`}
            >
              <div className="font-semibold text-gray-900">{model.name}</div>
              <div className="text-xs text-gray-600 mt-1">{model.description}</div>
              <div className="text-xs text-purple-600 mt-1">{model.contextLength.toLocaleString()} tokens</div>
            </button>
          ))}
        </div>
      </div>

      {/* Language Selector */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-700 mb-1">Исходный язык</label>
            <select
              value={fromLang}
              onChange={(e) => setFromLang(e.target.value)}
              disabled={state.status === 'translating'}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <button
            onClick={swapLanguages}
            disabled={state.status === 'translating'}
            className="mt-5 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Languages className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-700 mb-1">Целевой язык</label>
            <select
              value={toLang}
              onChange={(e) => setToLang(e.target.value)}
              disabled={state.status === 'translating'}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6">
          {/* Input */}
          <div className="flex flex-col">
            <label className="font-semibold text-gray-700 mb-2 text-sm">Исходный текст:</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={state.status === 'translating'}
              className="flex-grow min-h-[28rem] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm"
              placeholder="Вставьте текст для перевода..."
            />
            <div className="mt-2 text-xs text-gray-500">
              Символов: {inputText.length.toLocaleString()}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex lg:flex-col justify-center items-center gap-3 lg:w-48">
            <button
              onClick={startTranslation}
              disabled={state.status === 'translating' || !inputText.trim() || !apiKey}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {state.status === 'translating' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Перевожу...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Перевести</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopy}
              disabled={!outputText}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              <span>Скопировать</span>
            </button>

            <button
              onClick={handleClear}
              disabled={state.status === 'translating'}
              className="w-full bg-white hover:bg-red-50 text-red-600 border border-gray-300 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Очистить</span>
            </button>
          </div>

          {/* Output */}
          <div className="flex flex-col relative">
            <label className="font-semibold text-gray-700 mb-2 text-sm">Результат:</label>
            <textarea
              value={outputText}
              readOnly
              className="flex-grow min-h-[28rem] p-4 border border-gray-200 rounded-lg bg-gray-50 outline-none resize-none text-sm"
              placeholder="Результат появится здесь..."
            />
            <div className="mt-2 text-xs text-gray-500">
              Символов: {outputText.length.toLocaleString()}
            </div>

            {showToast && (
              <div className="absolute bottom-16 right-4 bg-gray-800 text-white text-xs px-4 py-2 rounded shadow-lg z-10">
                {toastMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      {(state.status === 'translating' || state.status === 'completed') && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>{state.status === 'completed' ? '✅ Готово!' : 'Перевожу...'}</span>
            <span className="text-gray-500">{state.currentChunk} / {state.totalChunks} частей</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-purple-600 h-full rounded-full transition-all"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          {state.status === 'translating' && (
            <div className="mt-3 text-sm text-purple-600 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Обработка части {state.currentChunk} из {state.totalChunks}. Не закрывайте страницу.</span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 mb-1">Ошибка перевода</h3>
              <p className="text-sm text-red-700">{state.error}</p>
              <button 
                onClick={startTranslation}
                className="mt-3 text-sm font-medium text-red-800 underline hover:text-red-900"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
