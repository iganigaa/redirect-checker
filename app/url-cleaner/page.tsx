'use client';

import { useState, useEffect } from 'react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            URL List Cleaner
          </h1>
          <p className="text-gray-600">
            Онлайн-инструмент для работы со списком URL
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Инструкция</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Скопируйте список URL-адресов, которые вы хотите преобразовать в доменное имя или стандартизировать.</li>
            <li>Вставьте список в поле ввода.</li>
            <li>Нажмите соответствующую кнопку, чтобы выполнить очистку или преобразование.</li>
            <li>Ваш результат появится в поле ввода.</li>
            <li>Скопируйте полученный список.</li>
          </ol>
        </div>

        {/* Input Field */}
        <div className="relative mb-6">
          <div className="absolute top-3 right-3 z-10">
            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              {lineCount} строк
            </span>
          </div>
          <textarea
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm resize-y font-mono text-sm"
            placeholder="Вставьте список URL (по одному в строке)"
          />

          {/* Toast */}
          {showToast && (
            <div className="absolute bottom-4 right-4 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fade-in">
              {toastMessage}
            </div>
          )}
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => processUrls('trimSlash')}
            className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg text-sm transition-all shadow-sm"
          >
            Обрезать конечный слэш /
          </button>

          <button
            onClick={() => processUrls('trimToSubfolder')}
            className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg text-sm transition-all shadow-sm"
          >
            Обрезать URL до подпапки
          </button>

          <button
            onClick={() => processUrls('removeProtocol')}
            className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg text-sm transition-all shadow-sm"
          >
            Удалить http/https
          </button>

          <button
            onClick={() => processUrls('removeUrlDuplicates')}
            className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg text-sm transition-all shadow-sm"
          >
            Удалить дубликаты URL
          </button>

          <button
            onClick={() => processUrls('removeDomainDuplicates')}
            className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg text-sm transition-all shadow-sm"
          >
            Удалить дубликаты домена
          </button>

          <button
            onClick={() => processUrls('sortAZ')}
            className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg text-sm transition-all shadow-sm"
          >
            Сортировка A—Z
          </button>

          <button
            onClick={() => processUrls('extractDomains')}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-4 rounded-lg text-sm transition-all shadow-sm"
          >
            Только домен
          </button>

          <button
            onClick={copyToClipboard}
            className="bg-cyan-500 hover:bg-cyan-600 text-white py-3 px-4 rounded-lg text-sm transition-all shadow-sm"
          >
            Скопировать
          </button>

          <button
            onClick={clearInput}
            className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg text-sm transition-all shadow-sm"
          >
            Очистить
          </button>
        </div>
      </div>
    </div>
  );
}