'use client';

import { useState } from 'react';

interface KeywordResult {
  url: string;
  keyword: string;
  position: number;
  frequency: number;
  exactFrequency: number;
  competition: string;
  date: string;
}

interface ProcessingStatus {
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  keywordsFound: number;
  error?: string;
}

export default function KeywordsCollector() {
  const [apiKey, setApiKey] = useState('');
  const [urls, setUrls] = useState('');
  const [minFrequency, setMinFrequency] = useState(1);
  const [maxPosition, setMaxPosition] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [processingStatuses, setProcessingStatuses] = useState<ProcessingStatus[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);
    setProcessingStatuses([]);

    try {
      const urlList = urls.split('\n').filter(url => url.trim());
      
      if (!apiKey.trim()) {
        throw new Error('Введите API ключ Keys.so');
      }

      if (urlList.length === 0) {
        throw new Error('Введите хотя бы один URL');
      }

      // Инициализация статусов
      const initialStatuses: ProcessingStatus[] = urlList.map(url => ({
        url: url.trim(),
        status: 'pending',
        progress: 0,
        keywordsFound: 0
      }));
      setProcessingStatuses(initialStatuses);

      const response = await fetch('/api/keywords-collector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          urls: urlList.map(url => url.trim()),
          minFrequency,
          maxPosition
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Не удалось получить поток данных');
      }

      let allResults: KeywordResult[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'status') {
                setProcessingStatuses(prev => 
                  prev.map(status => 
                    status.url === data.url 
                      ? { ...status, ...data.data }
                      : status
                  )
                );
              } else if (data.type === 'result') {
                allResults = [...allResults, ...data.data];
                setResults(allResults);
              } else if (data.type === 'error') {
                setError(data.message);
              } else if (data.type === 'complete') {
                console.log('Обработка завершена');
              }
            } catch (err) {
              console.error('Ошибка парсинга SSE:', err);
            }
          }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setUrls(text);
      };
      reader.readAsText(file);
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    const headers = ['URL', 'Ключевое слово', 'Позиция', 'Частотность', '!Частотность', 'Конкурентность', 'Дата сбора'];
    const csvContent = [
      headers.join(','),
      ...results.map(row => [
        `"${row.url}"`,
        `"${row.keyword}"`,
        row.position,
        row.frequency,
        row.exactFrequency,
        `"${row.competition}"`,
        row.date
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `keywords_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusColor = (status: ProcessingStatus['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-200';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-200';
    }
  };

  const getStatusText = (status: ProcessingStatus['status']) => {
    switch (status) {
      case 'pending': return 'Ожидание';
      case 'processing': return 'Обработка';
      case 'completed': return 'Завершено';
      case 'error': return 'Ошибка';
      default: return 'Неизвестно';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔍 Keywords Collector
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Собирайте ключевые слова для страниц сайта через API Keys.so с фильтрацией по позициям и частотности
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Key */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                API ключ Keys.so *
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Вставьте ваш API ключ"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Получите API ключ на{' '}
                <a 
                  href="https://keys.so" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  keys.so
                </a>
              </p>
            </div>

            {/* URLs Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Список URL (каждый с новой строки) *
              </label>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://example.com/page1/&#x0A;https://example.com/page2/"
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors font-mono text-sm"
                required
              />
              <div className="mt-2 flex items-center gap-4">
                <label className="text-sm text-gray-500 cursor-pointer hover:text-purple-600">
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="underline">📁 Загрузить из файла .txt</span>
                </label>
                <span className="text-sm text-gray-400">
                  {urls.split('\n').filter(u => u.trim()).length} URL
                </span>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Максимальная позиция
                </label>
                <input
                  type="number"
                  value={maxPosition}
                  onChange={(e) => setMaxPosition(parseInt(e.target.value) || 10)}
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                />
                <p className="mt-1 text-sm text-gray-500">
                  По умолчанию: 10 (первая страница)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Минимальная !Частотность
                </label>
                <input
                  type="number"
                  value={minFrequency}
                  onChange={(e) => setMinFrequency(parseInt(e.target.value) || 1)}
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Фильтр по точной частотности запроса
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {loading ? '🔄 Сбор ключевых слов...' : '🚀 Собрать ключевые слова'}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">❌ {error}</p>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {processingStatuses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📊 Статус обработки
            </h2>
            <div className="space-y-4">
              {processingStatuses.map((status, index) => (
                <div key={index} className="border-2 border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-gray-600 truncate max-w-md">
                      {status.url}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      status.status === 'completed' ? 'bg-green-100 text-green-800' :
                      status.status === 'error' ? 'bg-red-100 text-red-800' :
                      status.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusText(status.status)}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStatusColor(status.status)}`}
                        style={{ width: `${status.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {status.keywordsFound > 0 && `Найдено: ${status.keywordsFound} ключевых слов`}
                    </span>
                    <span className="text-gray-500">
                      {status.progress}%
                    </span>
                  </div>

                  {status.error && (
                    <p className="mt-2 text-sm text-red-600">
                      ⚠️ {status.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                📈 Результаты ({results.length} ключевых слов)
              </h2>
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
              >
                📥 Экспорт в CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-100 to-pink-100">
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-b-2 border-purple-200">
                      URL
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-b-2 border-purple-200">
                      Ключевое слово
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border-b-2 border-purple-200">
                      Позиция
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 border-b-2 border-purple-200">
                      Частотность
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 border-b-2 border-purple-200">
                      !Частотность
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border-b-2 border-purple-200">
                      Конкурентность
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border-b-2 border-purple-200">
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, index) => (
                    <tr
                      key={index}
                      className={`hover:bg-purple-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200 max-w-xs truncate">
                        <a 
                          href={row.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline"
                        >
                          {row.url}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 font-medium">
                        {row.keyword}
                      </td>
                      <td className="px-4 py-3 text-sm text-center border-b border-gray-200">
                        <span className={`inline-block px-2 py-1 rounded ${
                          row.position <= 3 ? 'bg-green-100 text-green-800' :
                          row.position <= 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {row.position}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 text-right">
                        {row.frequency.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 text-right font-semibold">
                        {row.exactFrequency.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200 text-center">
                        {row.competition}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200 text-center">
                        {row.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
