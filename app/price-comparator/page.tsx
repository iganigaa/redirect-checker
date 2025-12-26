'use client';

import { useState } from 'react';
import { Loader2, Plus, X, BarChart3, AlertCircle } from 'lucide-react';

interface CompetitorUrl {
  id: string;
  url: string;
  name?: string;
}

interface ServicePrice {
  service: string;
  ourPrice: string;
  competitorPrices: Record<string, string>;
}

interface AnalysisResult {
  ourServices: Array<{ service: string; price: string }>;
  competitors: Record<string, Array<{ service: string; price: string }>>;
  comparison: ServicePrice[];
}

export default function PriceComparator() {
  const [ourServiceUrl, setOurServiceUrl] = useState('');
  const [ourPriceUrl, setOurPriceUrl] = useState('');
  const [competitors, setCompetitors] = useState<CompetitorUrl[]>([
    { id: '1', url: '', name: '' }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const addCompetitor = () => {
    setCompetitors([
      ...competitors,
      { id: Date.now().toString(), url: '', name: '' }
    ]);
  };

  const removeCompetitor = (id: string) => {
    if (competitors.length > 1) {
      setCompetitors(competitors.filter(c => c.id !== id));
    }
  };

  const updateCompetitor = (id: string, field: 'url' | 'name', value: string) => {
    setCompetitors(
      competitors.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleAnalyze = async () => {
    setError(null);
    setResult(null);
    setProgress('');

    // Validation
    if (!ourServiceUrl || !ourPriceUrl) {
      setError('Пожалуйста, укажите URL страниц вашего сайта');
      return;
    }

    const validCompetitors = competitors.filter(c => c.url.trim());
    if (validCompetitors.length === 0) {
      setError('Добавьте хотя бы одного конкурента');
      return;
    }

    if (!apiKey) {
      setError('Укажите OpenAI API ключ');
      return;
    }

    setIsAnalyzing(true);

    try {
      setProgress('Загрузка HTML страниц...');

      const response = await fetch('/api/price-comparator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ourServiceUrl,
          ourPriceUrl,
          competitors: validCompetitors,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка анализа');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Не удалось получить поток данных');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonString = line.slice(6);
              console.log('[SSE] Received:', jsonString.substring(0, 200));
              const data = JSON.parse(jsonString);
              
              console.log('[SSE] Parsed type:', data.type);
              
              if (data.type === 'progress') {
                setProgress(data.message);
              } else if (data.type === 'result') {
                console.log('[SSE] Result data:', data.data);
                console.log('[SSE] Comparison length:', data.data?.comparison?.length);
                setResult(data.data);
                setProgress('Анализ завершен! Результаты готовы.');
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('Ошибка парсинга SSE:', e);
              console.error('Проблемная строка:', line);
            }
          }
        }
      }

      // Не показываем "завершен" если нет результата
      if (!result) {
        setProgress('Анализ завершен, но результаты не получены. Проверьте логи браузера (F12 → Console).');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Анализатор цен конкурентов
            </h1>
          </div>
          <p className="text-gray-600">
            AI-powered инструмент для сравнения цен на услуги с конкурентами
          </p>
        </div>

        {/* API Key Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            OpenAI API Ключ
          </h2>
          <div className="flex gap-3">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
            >
              {showApiKey ? '🙈 Скрыть' : '👁️ Показать'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Получите ключ на{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              platform.openai.com
            </a>
            . Ключ не сохраняется на сервере.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ваш сайт
          </h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Страница с описанием услуг
              </label>
              <input
                type="url"
                value={ourServiceUrl}
                onChange={(e) => setOurServiceUrl(e.target.value)}
                placeholder="https://example.com/services"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Страница с ценами
              </label>
              <input
                type="url"
                value={ourPriceUrl}
                onChange={(e) => setOurPriceUrl(e.target.value)}
                placeholder="https://example.com/prices"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Конкуренты
          </h2>

          <div className="space-y-3 mb-4">
            {competitors.map((competitor, index) => (
              <div key={competitor.id} className="flex gap-3">
                <input
                  type="text"
                  value={competitor.name}
                  onChange={(e) => updateCompetitor(competitor.id, 'name', e.target.value)}
                  placeholder={`Конкурент ${index + 1}`}
                  className="w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="url"
                  value={competitor.url}
                  onChange={(e) => updateCompetitor(competitor.id, 'url', e.target.value)}
                  placeholder="https://competitor.com/prices"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {competitors.length > 1 && (
                  <button
                    onClick={() => removeCompetitor(competitor.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addCompetitor}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Добавить конкурента
          </button>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-6"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Анализируем...
            </span>
          ) : (
            'Начать анализ'
          )}
        </button>

        {/* Progress */}
        {progress && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
            <p className="text-blue-700 font-medium">{progress}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Результаты сравнения
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                      Услуга
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-blue-600">
                      Наша цена
                    </th>
                    {Object.keys(result.competitors).map((competitor) => (
                      <th
                        key={competitor}
                        className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700"
                      >
                        {competitor}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.comparison.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">
                        {row.service}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-blue-600">
                        {row.ourPrice}
                      </td>
                      {Object.keys(result.competitors).map((competitor) => (
                        <td
                          key={competitor}
                          className="border border-gray-300 px-4 py-3 text-center text-gray-700"
                        >
                          {row.competitorPrices[competitor] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Export Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  const csv = generateCSV(result);
                  downloadCSV(csv, 'price-comparison.csv');
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📥 Экспорт в CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function generateCSV(result: AnalysisResult): string {
  const competitors = Object.keys(result.competitors);
  const headers = ['Услуга', 'Наша цена', ...competitors];
  
  const rows = result.comparison.map(row => [
    row.service,
    row.ourPrice,
    ...competitors.map(c => row.competitorPrices[c] || '')
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}


