'use client';

import { useState } from 'react';
import { ArrowRight, Copy, Trash2, Home as HomeIcon, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function TransliteratorPage() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Карта символов для транслитерации
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k',
    'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
    'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
    'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'э': 'e', 'ю': 'yu', 'я': 'ya', 'ё': 'yo'
  };

  const isVowel = (char: string) => /[аеёиоуыэюя]/i.test(char);

  const transliterateLine = (text: string): string => {
    text = text.toLowerCase();
    let result = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const prev = i > 0 ? text[i - 1] : '';
      const next = i < text.length - 1 ? text[i + 1] : '';

      // Обработка Е
      if (char === 'е') {
        if (i === 0 || isVowel(prev) || prev === 'ь' || prev === 'ъ' || prev === ' ' || prev === '-') {
          result += 'ye';
        } else {
          result += 'e';
        }
        continue;
      }

      // Обработка Ъ (твердый знак)
      if (char === 'ъ') continue;

      // Обработка Ь (мягкий знак)
      if (char === 'ь') {
        if (next === 'и') {
          result += 'y';
        }
        continue;
      }

      // Обработка окончаний -ый и -ий
      if (char === 'й') {
        const isEnd = (i === text.length - 1) || (!/[а-яё0-9]/i.test(next));

        if (isEnd) {
          if (prev === 'и') {
            result += 'y';
            continue;
          }
          if (prev === 'ы') {
            if (result.endsWith('y')) {
              result = result.slice(0, -1) + 'iy';
            } else {
              result += 'iy';
            }
            continue;
          }
        }
        result += 'y';
        continue;
      }

      // Обработка Ы
      if (char === 'ы') {
        result += 'y';
        continue;
      }

      // Стандартная замена
      if (map[char]) {
        result += map[char];
      } else if (/[a-z0-9]/.test(char)) {
        result += char;
      } else if (char === ' ' || char === '-' || char === '_') {
        if (!result.endsWith('-')) {
          result += '-';
        }
      }
    }

    return result.replace(/^-+|-+$/g, '');
  };

  const handleConvert = () => {
    if (!inputText.trim()) {
      showToastMessage('Введите текст!');
      return;
    }

    const lines = inputText.split('\n');
    const convertedLines = lines.map(line => transliterateLine(line));
    setOutputText(convertedLines.join('\n'));
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
        <span className="text-gray-900 font-medium">Транслитератор</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">
        Генератор правильных ссылок
      </h1>

      {/* Main Interface */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6">
          {/* Input Column */}
          <div className="flex flex-col">
            <label className="font-semibold text-gray-700 mb-2 text-sm">
              Русские словосочетания:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-grow min-h-[24rem] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none font-mono text-sm"
              placeholder="Введите текст здесь..."
            />
            <div className="mt-2 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded inline-block">
              Кол-во символов: {inputText.length}
            </div>
          </div>

          {/* Buttons Column */}
          <div className="flex lg:flex-col justify-center items-center gap-3 lg:w-48">
            <button
              onClick={handleConvert}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>Преобразовать</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopy}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Copy className="w-4 h-4" />
              <span>Скопировать</span>
            </button>

            <button
              onClick={handleClear}
              className="w-full bg-white hover:bg-red-50 text-red-600 border border-gray-300 hover:border-red-200 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Очистить</span>
            </button>
          </div>

          {/* Output Column */}
          <div className="flex flex-col relative">
            <label className="font-semibold text-gray-700 mb-2 text-sm">
              Правильные ссылки:
            </label>
            <textarea
              value={outputText}
              readOnly
              className="flex-grow min-h-[24rem] p-4 border border-gray-200 rounded-lg bg-gray-50 outline-none resize-none font-mono text-sm text-gray-600"
              placeholder="Результат появится здесь..."
            />
            <div className="mt-2 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded inline-block">
              Кол-во символов: {outputText.length}
            </div>

            {/* Toast */}
            {showToast && (
              <div className="absolute bottom-16 right-4 bg-gray-800 text-white text-xs px-4 py-2 rounded shadow-lg animate-fade-in">
                {toastMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Правила транскрибирования (Yandex)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          С 04.12.19 сервис придерживается рекомендованных правил. Основные особенности:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
          <div className="bg-gray-50 p-3 rounded border border-gray-100">
            <span className="font-bold text-purple-600">Е → ye</span> в начале слова, после гласных и ъ/ь.
          </div>
          <div className="bg-gray-50 p-3 rounded border border-gray-100">
            <span className="font-bold text-purple-600">Ё → yo</span> всегда.
          </div>
          <div className="bg-gray-50 p-3 rounded border border-gray-100">
            <span className="font-bold text-purple-600">Й → y</span> всегда.
          </div>
          <div className="bg-gray-50 p-3 rounded border border-gray-100">
            <span className="font-bold text-purple-600">Ж → zh</span>, <span className="font-bold text-purple-600">Х → kh</span>, <span className="font-bold text-purple-600">Ц → ts</span>
          </div>
          <div className="bg-gray-50 p-3 rounded border border-gray-100">
            <span className="font-bold text-purple-600">Ъ</span> не пишется (кроме случая перед Е).
          </div>
          <div className="bg-gray-50 p-3 rounded border border-gray-100">
            <span className="font-bold text-purple-600">Ы → y</span> (исключение окончания -ый/-ий → iy).
          </div>
        </div>
      </div>
    </div>
  );
}
