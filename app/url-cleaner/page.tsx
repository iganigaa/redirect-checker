'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home as HomeIcon, ChevronRight, Copy } from 'lucide-react';

export default function UrlCleanerPage() {
  const [urlInput, setUrlInput] = useState('');
  const [lineCount, setLineCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    updateLineCount();
  }, [urlInput]);

  const updateLineCount = () => {
    const lines = urlInput.split(/\r?\n/).filter(line => line.trim() !== '');
    setLineCount(lines.length);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getLines = () => {
    return urlInput.split(/\r?\n/).filter(line => line.trim() !== '');
  };

  const setLines = (lines: string[]) => {
    setUrlInput(lines.join('\n'));
  };

  const parseUrl = (urlStr: string) => {
    let tempUrl = urlStr.trim();
    if (!/^https?:\/\//i.test(tempUrl)) {
      tempUrl = 'http://' + tempUrl;
    }
    try {
      return new URL(tempUrl);
    } catch (e) {
      return null;
    }
  };

  const processUrls = (action: string) => {
    let lines = getLines();
    if (lines.length === 0) {
      showToastMessage("Список пуст!");
      return;
    }

    let processed: string[] = [];
    let message = "Готово";

    switch (action) {
      case 'trimSlash':
        processed = lines.map(line => line.replace(/\/+$/, ''));
        message = "Конечные слэши удалены";
        break;

      case 'trimToSubfolder':
        processed = lines.map(line => {
          const url = parseUrl(line);
          if (!url) return line;

          let cleanPath = url.origin + url.pathname;

          if (!cleanPath.endsWith('/')) {
            const lastSlashIndex = cleanPath.lastIndexOf('/');
            if (lastSlashIndex > url.origin.length) {
              cleanPath = cleanPath.substring(0, lastSlashIndex + 1);
            }
          }
          return cleanPath.replace(/\/+$/, '');
        });
        message = "URL обрезаны до подпапок";
        break;

      case 'removeProtocol':
        processed = lines.map(line => line.replace(/^https?:\/\//i, ''));
        message = "Протоколы удалены";
        break;

      case 'removeUrlDuplicates':
        processed = [...new Set(lines)];
        message = `Удалено дублей: ${lines.length - processed.length}`;
        break;

      case 'removeDomainDuplicates':
        const seenDomains = new Set<string>();
        processed = lines.filter(line => {
          const url = parseUrl(line);
          if (!url) return true;
          const domain = url.hostname.replace(/^www\./i, '');
          if (seenDomains.has(domain)) {
            return false;
          }
          seenDomains.add(domain);
          return true;
        });
        message = `Удалено дублей доменов: ${lines.length - processed.length}`;
        break;

      case 'sortAZ':
        processed = [...lines].sort((a, b) => a.localeCompare(b));
        message = "Отсортировано A-Z";
        break;

      case 'extractDomains':
        processed = lines.map(line => {
          const url = parseUrl(line);
          return url ? url.hostname : line;
        });
        message = "Домены извлечены";
        break;
    }

    setLines(processed);
    showToastMessage(message);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(urlInput);
      showToastMessage("Скопировано!");
    } catch (err) {
      showToastMessage("Ошибка копирования");
    }
  };

  const clearInput = () => {
    if (urlInput === '') return;
    if (confirm('Вы уверены, что хотите очистить поле?')) {
      setUrlInput('');
      showToastMessage("Очищено");
    }
  };

  return (
    <div className="max-w-7xl mx-auto overflow-x-hidden">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link href="/" className="hover:text-purple-600 transition-colors">
          <HomeIcon className="w-4 h-4" />
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">URL Cleaner</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">
        URL List Cleaner
      </h1>

      {/* Instructions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">Инструкция</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Скопируйте список URL-адресов, которые вы хотите преобразовать в доменное имя или стандартизировать.</li>
          <li>Вставьте список в поле ввода.</li>
          <li>Нажмите соответствующую кнопку, чтобы выполнить очистку или преобразование.</li>
          <li>Ваш результат появится в поле ввода.</li>
          <li>Скопируйте полученный список.</li>
        </ol>
      </div>

      {/* Input Field */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="relative">
          <div className="absolute top-3 right-3 z-10">
            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
              {lineCount} строк
            </span>
          </div>
          <textarea
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y font-mono text-sm"
            placeholder="Вставьте список URL (по одному в строке)"
          />

          {/* Toast */}
          {showToast && (
            <div className="absolute bottom-4 right-4 bg-gray-800 text-white text-xs px-4 py-2 rounded-lg shadow-lg animate-fade-in">
              {toastMessage}
            </div>
          )}
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">Действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => processUrls('trimSlash')}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg text-sm transition-all font-medium"
          >
            Обрезать конечный слэш /
          </button>

          <button
            onClick={() => processUrls('trimToSubfolder')}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg text-sm transition-all font-medium"
          >
            Обрезать URL до подпапки
          </button>

          <button
            onClick={() => processUrls('removeProtocol')}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg text-sm transition-all font-medium"
          >
            Удалить http/https
          </button>

          <button
            onClick={() => processUrls('removeUrlDuplicates')}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg text-sm transition-all font-medium"
          >
            Удалить дубликаты URL
          </button>

          <button
            onClick={() => processUrls('removeDomainDuplicates')}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg text-sm transition-all font-medium"
          >
            Удалить дубликаты домена
          </button>

          <button
            onClick={() => processUrls('sortAZ')}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg text-sm transition-all font-medium"
          >
            Сортировка A—Z
          </button>

          <button
            onClick={() => processUrls('extractDomains')}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-4 rounded-lg text-sm transition-all"
          >
            Только домен
          </button>

          <button
            onClick={copyToClipboard}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-sm transition-all font-medium inline-flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Скопировать
          </button>

          <button
            onClick={clearInput}
            className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg text-sm transition-all font-medium"
          >
            Очистить
          </button>
        </div>
      </div>
    </div>
  );
}
