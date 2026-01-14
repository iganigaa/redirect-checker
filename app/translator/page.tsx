'use client';

import { useState } from 'react';
import { Languages, Copy, Trash2, Home as HomeIcon, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  originalLength: number;
  translatedLength: number;
  chunksCount: number;
  estimatedTokens: number;
  processingTime: number;
}

export default function TranslatorPage() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Языковые пары
  const [fromLang, setFromLang] = useState('English');
  const [toLang, setToLang] = useState('Russian');

  const languages = [
    'English',
    'Russian',
    'Spanish',
    'French',
    'German',
    'Chinese',
    'Japanese'
  ];

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      showToastMessage('Введите текст для перевода!');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStats(null);

    try {
      const response = await fetch('/api/translator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          fromLang,
          toLang,
          maxParallel: 5
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ошибка перевода');
      }

      setOutputText(data.result);
      setStats(data.stats);
      showToastMessage('Перевод выполнен!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      showToastMessage(`Ошибка: ${errorMessage}`);
    } finally {
      setIsLoading(false);
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
    setStats(null);
    setError(null);
  };

  const swapLanguages = () => {
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
    
    // Опционально: также обменять тексты
    const tempText = inputText;
    setInputText(outputText);
    setOutputText(tempText);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-600" />
          AI Переводчик текстов
        </h1>
        <p className="text-gray-600 text-sm">
          Умный перевод больших текстов через DeepSeek V3 с чанкированием
        </p>
      </div>

      {/* Language Selector */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Исходный язык
            </label>
            <select
              value={fromLang}
              onChange={(e) => setFromLang(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <button
            onClick={swapLanguages}
            className="mt-5 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Поменять местами"
          >
            <Languages className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Целевой язык
            </label>
            <select
              value={toLang}
              onChange={(e) => setToLang(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
          {/* Input Column */}
          <div className="flex flex-col">
            <label className="font-semibold text-gray-700 mb-2 text-sm">
              Исходный текст:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              className="flex-grow min-h-[28rem] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Вставьте текст для перевода здесь..."
            />
            <div className="mt-2 flex gap-3 text-xs text-gray-500">
              <span className="bg-gray-100 px-3 py-1 rounded">
                Символов: {inputText.length.toLocaleString()}
              </span>
              {inputText.length > 0 && (
                <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded">
                  ~{Math.ceil(inputText.length / 4)} токенов
                </span>
              )}
            </div>
          </div>

          {/* Buttons Column */}
          <div className="flex lg:flex-col justify-center items-center gap-3 lg:w-48">
            <button
              onClick={handleTranslate}
              disabled={isLoading || !inputText.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
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
              className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy className="w-4 h-4" />
              <span>Скопировать</span>
            </button>

            <button
              onClick={handleClear}
              disabled={isLoading}
              className="w-full bg-white hover:bg-red-50 text-red-600 border border-gray-300 hover:border-red-200 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Очистить</span>
            </button>
          </div>

          {/* Output Column */}
          <div className="flex flex-col relative">
            <label className="font-semibold text-gray-700 mb-2 text-sm">
              Результат перевода:
            </label>
            <textarea
              value={outputText}
              readOnly
              className="flex-grow min-h-[28rem] p-4 border border-gray-200 rounded-lg bg-gray-50 outline-none resize-none text-sm text-gray-700"
              placeholder="Результат появится здесь..."
            />
            <div className="mt-2 flex gap-3 text-xs text-gray-500">
              <span className="bg-gray-100 px-3 py-1 rounded">
                Символов: {outputText.length.toLocaleString()}
              </span>
              {stats && (
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded">
                  {(stats.processingTime / 1000).toFixed(1)}с
                </span>
              )}
            </div>

            {/* Toast */}
            {showToast && (
              <div className="absolute bottom-16 right-4 bg-gray-800 text-white text-xs px-4 py-2 rounded shadow-lg animate-fade-in z-10">
                {toastMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 shadow-sm p-6 mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Статистика перевода
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-3 border border-purple-100">
              <div className="text-xs text-gray-600 mb-1">Чанков</div>
              <div className="text-lg font-bold text-purple-600">{stats.chunksCount}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-100">
              <div className="text-xs text-gray-600 mb-1">Токенов</div>
              <div className="text-lg font-bold text-purple-600">~{stats.estimatedTokens}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-100">
              <div className="text-xs text-gray-600 mb-1">Время</div>
              <div className="text-lg font-bold text-purple-600">{(stats.processingTime / 1000).toFixed(1)}с</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-100">
              <div className="text-xs text-gray-600 mb-1">Исходный</div>
              <div className="text-lg font-bold text-purple-600">{stats.originalLength}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-100">
              <div className="text-xs text-gray-600 mb-1">Переведено</div>
              <div className="text-lg font-bold text-purple-600">{stats.translatedLength}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Section */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-red-600 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-800 mb-1">Ошибка перевода</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Возможности AI переводчика
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="font-bold text-purple-700 mb-2">⚡ Быстрое чанкирование</div>
            <div className="text-gray-600 text-xs">
              Умная разбивка больших текстов на оптимальные чанки по 3500 символов
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="font-bold text-blue-700 mb-2">🤖 DeepSeek V3</div>
            <div className="text-gray-600 text-xs">
              Мощная модель через OpenRouter для качественного перевода
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="font-bold text-green-700 mb-2">🔄 Параллельная обработка</div>
            <div className="text-gray-600 text-xs">
              До 5 параллельных запросов для максимальной скорости
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="font-bold text-orange-700 mb-2">📝 Сохранение структуры</div>
            <div className="text-gray-600 text-xs">
              Переводит с учетом контекста, заголовков и списков
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
            <div className="font-bold text-pink-700 mb-2">🎯 Overlap для точности</div>
            <div className="text-gray-600 text-xs">
              1 предложение overlap между чанками для консистентности
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
            <div className="font-bold text-indigo-700 mb-2">📊 Подробная статистика</div>
            <div className="text-gray-600 text-xs">
              Время обработки, количество токенов и чанков
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
