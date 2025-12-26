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
  debug?: {
    competitorHTMLs: Record<string, string>;
    competitorTexts: Record<string, string>;
    competitorDebugInfo: Record<string, {
      htmlSize: number;
      textSize: number;
      textPreview: string;
    }>;
  };
}

interface HTMLData {
  url: string;
  name: string;
  html: string;
  textPreview: string;
  size: number;
}

interface Stage1Result {
  ourServiceHTML: string;
  ourPriceHTML: string;
  competitorHTMLs: Record<string, string>;
  competitors: CompetitorUrl[];
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
  
  // Stage management
  const [currentStage, setCurrentStage] = useState<'input' | 'stage1' | 'stage2' | 'stage3'>('input');
  const [stage1Data, setStage1Data] = useState<Stage1Result | null>(null);
  const [stage2Data, setStage2Data] = useState<{
    ourServices: Array<{ service: string; price: string }>;
    competitors: Record<string, Array<{ service: string; price: string }>>;
  } | null>(null);
  const [htmlData, setHtmlData] = useState<HTMLData[]>([]);

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

  // ЭТАП 1: Скачивание HTML
  const handleStage1 = async () => {
    setError(null);
    setResult(null);
    setProgress('');
    setHtmlData([]);

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

    setIsAnalyzing(true);
    setCurrentStage('stage1');

    try {
      setProgress('🌐 Этап 1: Скачивание HTML страниц...');

      const response = await fetch('/api/price-comparator/stage1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ourServiceUrl,
          ourPriceUrl,
          competitors: validCompetitors,
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
              } else if (data.type === 'stage1_complete') {
                console.log('[SSE Stage1] HTML data received');
                setStage1Data(data.data);
                
                // Prepare HTML data for display
                const htmlDataArray: HTMLData[] = [];
                
                // Add our site
                htmlDataArray.push({
                  url: ourServiceUrl,
                  name: 'Ваш сайт (услуги)',
                  html: data.data.ourServiceHTML,
                  textPreview: data.data.ourServiceHTML.substring(0, 500),
                  size: data.data.ourServiceHTML.length
                });
                
                htmlDataArray.push({
                  url: ourPriceUrl,
                  name: 'Ваш сайт (цены)',
                  html: data.data.ourPriceHTML,
                  textPreview: data.data.ourPriceHTML.substring(0, 500),
                  size: data.data.ourPriceHTML.length
                });
                
                // Add competitors
                Object.entries(data.data.competitorHTMLs).forEach(([name, html]) => {
                  htmlDataArray.push({
                    url: name,
                    name: name,
                    html: html as string,
                    textPreview: (html as string).substring(0, 500),
                    size: (html as string).length
                  });
                });
                
                setHtmlData(htmlDataArray);
                setProgress('✅ Этап 1 завершен! HTML страницы скачаны. Проверьте их и переходите к Этапу 2.');
              } else if (data.type === 'result') {
                console.log('[SSE] Final result data:', data.data);
                setResult(data.data);
                setProgress('✅ Анализ завершен! Результаты готовы.');
                setCurrentStage('input');
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

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(errorMessage);
      console.error('Error Stage 1:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ЭТАП 2: Извлечение цен из HTML каждого конкурента
  const handleStage2 = async () => {
    if (!stage1Data) {
      setError('Сначала выполните Этап 1');
      return;
    }

    if (!apiKey) {
      setError('Укажите OpenAI/OpenRouter API ключ');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setCurrentStage('stage2');
    setStage2Data(null);
    setProgress('🤖 Этап 2: Извлекаем цены с помощью AI...');

    try {
      const response = await fetch('/api/price-comparator/stage2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage1Data,
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
              console.log('[SSE Stage2] Received:', jsonString.substring(0, 200));
              const data = JSON.parse(jsonString);
              
              console.log('[SSE Stage2] Parsed type:', data.type);
              
              if (data.type === 'progress') {
                setProgress(data.message);
              } else if (data.type === 'stage2_complete') {
                console.log('[SSE Stage2] Prices extracted:', data.data);
                setStage2Data(data.data);
                setProgress('✅ Этап 2 завершен! Цены извлечены. Проверьте таблицы и переходите к Этапу 3.');
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('Ошибка парсинга SSE Stage2:', e);
              console.error('Проблемная строка:', line);
            }
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(errorMessage);
      console.error('Error Stage 2:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ЭТАП 3: Сопоставление услуг и создание итоговой таблицы
  const handleStage3 = async () => {
    if (!stage2Data) {
      setError('Сначала выполните Этап 2');
      return;
    }

    if (!apiKey) {
      setError('Укажите OpenAI/OpenRouter API ключ');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setCurrentStage('stage3');
    setProgress('🔗 Этап 3: Сопоставляем услуги...');

    try {
      const response = await fetch('/api/price-comparator/stage3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage2Data,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сопоставления');
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
              console.log('[SSE Stage3] Received:', jsonString.substring(0, 200));
              const data = JSON.parse(jsonString);
              
              if (data.type === 'progress') {
                setProgress(data.message);
              } else if (data.type === 'result') {
                console.log('[SSE Stage3] Final comparison:', data.data);
                setResult(data.data);
                setProgress('✅ Анализ завершен! Итоговая таблица готова.');
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('Ошибка парсинга SSE Stage3:', e);
            }
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(errorMessage);
      console.error('Error Stage 3:', err);
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

        {/* Stage 1 Button */}
        {currentStage === 'input' && (
          <button
            onClick={handleStage1}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-6"
          >
            {isAnalyzing && currentStage === 'stage1' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Этап 1: Скачиваем HTML...
              </span>
            ) : (
              '🌐 Этап 1: Скачать HTML страниц'
            )}
          </button>
        )}

        {/* Stage 1 Results */}
        {htmlData.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ✅ Этап 1 завершен: HTML страницы скачаны
            </h2>
            
            <div className="space-y-3 mb-6">
              {htmlData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600">{item.url}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Размер: {(item.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadHTML(item.html, `${item.name.replace(/[^a-z0-9]/gi, '_')}.html`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      📄 Скачать HTML
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-yellow-800 font-medium">
                💡 Проверьте скачанные HTML файлы
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Откройте файлы и убедитесь что на страницах есть цены. Если всё в порядке - переходите к Этапу 2.
              </p>
            </div>

            <button
              onClick={handleStage2}
              disabled={isAnalyzing || !apiKey}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isAnalyzing && currentStage === 'stage2' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Этап 2: Извлекаем цены...
                </span>
              ) : !apiKey ? (
                '⚠️ Укажите API ключ выше для продолжения'
              ) : (
                '🤖 Этап 2: Извлечь цены из HTML (AI)'
              )}
            </button>
          </div>
        )}

        {/* Stage 2 Results - Extracted Prices */}
        {stage2Data && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ✅ Этап 2 завершен: Цены извлечены
            </h2>

            {/* Our Services */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-blue-600 mb-3">
                📋 Ваши услуги ({stage2Data.ourServices.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Услуга</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Цена</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stage2Data.ourServices.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{item.service}</td>
                        <td className="border border-gray-300 px-4 py-2 font-semibold">{item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Competitors */}
            {Object.entries(stage2Data.competitors).map(([name, services]) => (
              <div key={name} className="mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  🏢 {name} ({services.length} услуг{services.length === 0 ? ' не найдено' : ''})
                </h3>
                {services.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Услуга</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Цена</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2">{item.service}</td>
                            <td className="border border-gray-300 px-4 py-2 font-semibold">{item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">❌ Цены не найдены на этой странице. Проверьте HTML файл из Этапа 1.</p>
                  </div>
                )}
              </div>
            ))}

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-yellow-800 font-medium">
                💡 Проверьте извлеченные цены
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Убедитесь что AI правильно распознал услуги и цены. Если всё верно - переходите к Этапу 3 для сопоставления.
              </p>
            </div>

            <button
              onClick={handleStage3}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isAnalyzing && currentStage === 'stage3' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Этап 3: Сопоставляем услуги...
                </span>
              ) : (
                '🔗 Этап 3: Сопоставить услуги и создать итоговую таблицу'
              )}
            </button>
          </div>
        )}

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

            {/* Debug Info Section */}
            {result.debug && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  🔍 Отладочная информация
                </h3>
                <div className="space-y-3">
                  {Object.entries(result.debug.competitorDebugInfo).map(([name, info]) => (
                    <div key={name} className="flex flex-wrap items-center gap-3 p-3 bg-white rounded border border-gray-200">
                      <div className="flex-1 min-w-[200px]">
                        <div className="font-medium text-gray-900">{name}</div>
                        <div className="text-sm text-gray-600">
                          HTML: {(info.htmlSize / 1024).toFixed(1)} KB | 
                          Текст: {(info.textSize / 1024).toFixed(1)} KB
                        </div>
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                            Показать превью текста
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32">
                            {info.textPreview}...
                          </pre>
                        </details>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadHTML(result.debug!.competitorHTMLs[name], `${name.replace(/[^a-z0-9]/gi, '_')}.html`)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          📄 HTML
                        </button>
                        <button
                          onClick={() => downloadText(result.debug!.competitorTexts[name], `${name.replace(/[^a-z0-9]/gi, '_')}.txt`)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          📝 Текст
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  💡 Скачайте HTML/Текст для проверки того, что было отправлено в AI для анализа
                </p>
              </div>
            )}

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

function downloadHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}


