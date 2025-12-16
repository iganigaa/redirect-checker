'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Montserrat } from 'next/font/google';
import Link from 'next/link';
import { 
  Filter, 
  X, 
  Download, 
  Copy, 
  Search, 
  Settings, 
  Globe,
  Smartphone,
  Monitor,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Move,
  ArrowLeftRight,
  MousePointer2,
  Info,
  Home as HomeIcon,
  ChevronRight
} from 'lucide-react';

const montserrat = Montserrat({ 
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

interface Result {
  number: number;
  checkName: string;
  url: string;
  expected: string;
  statusCode: number | null;
  redirectChain: string[];
  redirectSteps: Array<{ url: string; statusCode: number }>;
  fact: string;
  recommendation: string;
  status: '✅' | '❌' | '⚠️';
  message: string;
}

interface ColumnWidths {
  number: number;
  checkName: number;
  url: number;
  expected: number;
  fact: number;
  status: number;
  recommendation: number;
}

// Компонент для resizable таблицы
function ResizableTable({ 
  results, 
  columnWidths, 
  setColumnWidths 
}: { 
  results: Result[]; 
  columnWidths: ColumnWidths;
  setColumnWidths: React.Dispatch<React.SetStateAction<ColumnWidths>>;
}) {
  const [resizing, setResizing] = useState<{ column: keyof ColumnWidths; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      
      const delta = e.clientX - resizing.startX;
      const newWidth = Math.max(50, resizing.startWidth + delta);
      
      setColumnWidths(prev => ({
        ...prev,
        [resizing.column]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing, setColumnWidths]);

  const startResize = (column: keyof ColumnWidths, e: React.MouseEvent) => {
    e.preventDefault();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column]
    });
  };

  const columns: { key: keyof ColumnWidths; label: string }[] = [
    { key: 'number', label: '№' },
    { key: 'checkName', label: 'Проверка' },
    { key: 'url', label: 'Какой URL проверяем' },
    { key: 'expected', label: 'Ожидается' },
    { key: 'fact', label: 'Факт' },
    { key: 'status', label: 'Статус' },
    { key: 'recommendation', label: 'Результат' }
  ];

  const totalWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);
  
  return (
    <div className="relative">
      <table className="border-collapse text-left" style={{ 
        tableLayout: 'fixed',
        width: `${totalWidth}px`
      }}>
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 font-semibold">
            {columns.map((col) => (
              <th
                key={col.key}
                className="relative px-4 py-4 border-r border-gray-200 last:border-r-0"
                style={{ width: `${columnWidths[col.key]}px` }}
              >
                <div className="truncate pr-2" title={col.label}>
                  {col.label}
                </div>
                <div
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-400 active:bg-indigo-600 transition-colors"
                  onMouseDown={(e) => startResize(col.key, e)}
                  style={{ userSelect: 'none' }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {results.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-normal">В этой категории нет результатов.</p>
                </div>
              </td>
            </tr>
          ) : (
            results.map((result, index) => (
              <tr key={index} className="hover:bg-gray-50/80 transition-colors group" style={{ height: '48px' }}>
                <td className="px-4 py-2 text-sm font-medium text-gray-900" style={{ width: `${columnWidths.number}px` }}>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={String(result.number)}>
                    {result.number}
                  </div>
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900" style={{ width: `${columnWidths.checkName}px` }}>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={result.checkName}>
                    {result.checkName}
                  </div>
                </td>
                <td className="px-4 py-2 text-sm text-gray-700" style={{ width: `${columnWidths.url}px` }}>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={result.url}>
                    <code className="text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                      {result.url}
                    </code>
                  </div>
                </td>
                <td className="px-4 py-2 text-xs text-gray-700 font-medium" style={{ width: `${columnWidths.expected}px` }}>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={result.expected}>
                    {result.expected}
                  </div>
                </td>
                <td className="px-4 py-2 text-xs text-gray-700 font-medium" style={{ width: `${columnWidths.fact}px` }}>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={result.fact}>
                    {result.fact}
                  </div>
                </td>
                <td className="px-4 py-2 text-center" style={{ width: `${columnWidths.status}px` }}>
                  <div className="flex justify-center overflow-hidden text-ellipsis whitespace-nowrap">
                    {result.status === '✅' ? (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                    ) : result.status === '❌' ? (
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-red-600" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-sm font-normal" style={{ width: `${columnWidths.recommendation}px` }}>
                  <div 
                    className={`overflow-hidden text-ellipsis whitespace-nowrap ${
                      result.status === '❌' ? 'text-red-700' : 
                      result.status === '⚠️' ? 'text-yellow-700' : 
                      'text-green-700'
                    }`} 
                    title={result.recommendation}
                  >
                    {result.recommendation}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [userAgent, setUserAgent] = useState('Googlebot Smartphone');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | '✅' | '❌' | '⚠️'>('all');
  const [columnWidths, setColumnWidths] = useState({
    number: 60,
    checkName: 150,
    url: 200,
    expected: 200,
    fact: 250,
    status: 80,
    recommendation: 250
  });
  const [showHint, setShowHint] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);
    
    try {
      const response = await axios.post('/api/check-redirects', {
        url,
        userAgent
      });
      
      setResults(response.data.results);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при проверке сайта');
    } finally {
      setLoading(false);
    }
  };


  // Экспорт в CSV
  const exportToCSV = () => {
    const headers = ['№', 'Проверка', 'Какой URL проверяем', 'Ожидается', 'Факт', 'Статус', 'Результат'];
    const rows = filteredResults.map(r => [
      r.number,
      r.checkName,
      r.url,
      r.expected,
      r.fact,
      r.status,
      r.recommendation
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `redirect-check-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Копирование в буфер обмена
  const copyToClipboard = () => {
    const headers = ['№', 'Проверка', 'Какой URL проверяем', 'Ожидается', 'Факт', 'Статус', 'Результат'];
    const rows = filteredResults.map(r => [
      r.number,
      r.checkName,
      r.url,
      r.expected,
      r.fact,
      r.status,
      r.recommendation
    ]);
    
    const text = [headers, ...rows]
      .map(row => row.join('\t'))
      .join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      alert('Таблица скопирована в буфер обмена');
    });
  };

  // Подсчет статистики
  const successCount = results.filter(r => r.status === '✅').length;
  const warningCount = results.filter(r => r.status === '⚠️').length;
  const errorCount = results.filter(r => r.status === '❌').length;

  const filteredResults = filterStatus === 'all' 
    ? results 
    : results.filter(r => r.status === filterStatus);

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 pb-12 ${montserrat.className}`}>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-6 overflow-x-visible">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link 
              href="/" 
              className="flex items-center gap-1 hover:text-gray-700 transition-colors no-underline"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Главная</span>
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-700 font-medium">Redirect Checker</span>
          </nav>

          {/* Title Section */}
          <div className="w-full">
            <h1 className="text-3xl font-semibold text-gray-900">Проверка основных редиректов сайта</h1>
            <p className="text-sm text-gray-500 mt-2 font-normal">Комплексная диагностика HTTP заголовков и цепочек переадресации по 11 критериям.</p>
          </div>
          
          {/* Settings Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-full">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="md:col-span-7 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Основной адрес сайта</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="https://example.com/"
                required
              />
                </div>
            </div>
            
              <div className="md:col-span-3 space-y-2">
                <label className="block text-sm font-medium text-gray-700">User-Agent</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {userAgent.includes('Smartphone') ? <Smartphone className="h-4 w-4 text-gray-400"/> : <Monitor className="h-4 w-4 text-gray-400"/>}
                  </div>
              <select
                value={userAgent}
                onChange={(e) => setUserAgent(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none"
              >
                <option>Googlebot Smartphone</option>
                <option>Googlebot Desktop</option>
                <option>YandexBot</option>
                <option>BingBot</option>
              </select>
                </div>
            </div>
            
              <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <Search className="w-4 h-4" />
                  {loading ? 'Проверка...' : 'Проверить'}
              </button>
              </div>
            </div>
              
              {loading && (
              <div className="mt-4 text-center">
                <span className="text-gray-500 text-sm">⏱ Ожидайте 1-2 минуты...</span>
              </div>
              )}
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>
        
          {/* Dashboard Stats */}
          {results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-green-300 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-500">Всё отлично</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">{successCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-yellow-300 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-500">Предупреждения</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">{warningCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-red-300 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-500">Ошибки</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">{errorCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        )}

          {/* Results Section */}
          {results.length > 0 && (
            <div className="w-full overflow-x-visible">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-full">
            {/* Toolbar */}
            <div className="border-b border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
              
              {/* Tabs */}
              <div className="flex p-1 bg-gray-200 rounded-lg self-start sm:self-auto">
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filterStatus === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Все результаты
                </button>
                <button 
                  onClick={() => setFilterStatus('✅')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${filterStatus === '✅' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Всё ок
                </button>
                <button 
                  onClick={() => setFilterStatus('⚠️')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${filterStatus === '⚠️' ? 'bg-white text-yellow-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Предупреждения
                </button>
                <button 
                  onClick={() => setFilterStatus('❌')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${filterStatus === '❌' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Ошибки
                    </button>
                </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Копировать</span>
                </button>
                <button 
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Скачать CSV</span>
                </button>
              </div>
            </div>

                <div className="overflow-x-auto" style={{ width: '100%' }}>
                  <div style={{ minWidth: 'max-content' }}>
                    <ResizableTable 
                      results={filteredResults} 
                      columnWidths={columnWidths}
                      setColumnWidths={setColumnWidths}
                    />
                  </div>
                </div>

                {/* Подсказка для пользователей */}
                {showHint && (
                  <div className="border-t border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Info className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Интерактивная таблица</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Прокрутка */}
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-gray-200 shadow-sm animate-pulse">
                                <Move className="w-3 h-3 text-indigo-600" />
                                <ArrowLeftRight className="w-3 h-3 text-indigo-600" />
                              </div>
                              <span className="font-medium">Прокручивайте таблицу влево/вправо</span>
                            </div>
                            {/* Изменение размера */}
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-gray-200 shadow-sm">
                                <MousePointer2 className="w-3 h-3 text-purple-600 animate-bounce" />
                                <div className="w-0.5 h-4 bg-purple-600 animate-pulse"></div>
                              </div>
                              <span className="font-medium">Тяните границы столбцов для изменения ширины</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowHint(false)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        title="Скрыть подсказку"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Educational Content Section */}
        <div className="max-w-4xl mx-auto mt-16 space-y-12">
          {/* Schema.org JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "REDIRECT CHECKER",
                "applicationCategory": "SEO Tool",
                "operatingSystem": "Web",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                },
                "featureList": [
                  "11 типов проверки редиректов",
                  "Эмуляция Googlebot/Yandex Bot",
                  "Экспорт CSV",
                  "Проверка canonical-тегов"
                ],
                "author": {
                  "@type": "Person",
                  "name": "Игорь Бурдуков"
                },
                "datePublished": "2025-12-16",
                "dateModified": "2025-12-16"
              })
            }}
          />

          {/* Executive Summary */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              REDIRECT CHECKER — автоматическая проверка редиректов сайта для SEO
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong>REDIRECT CHECKER</strong> — бесплатный инструмент для автоматической проверки 11 критических сценариев редиректов сайта: HTTPS, WWW, trailing slash, регистр URL, index-файлы и canonical-теги. Проверка занимает 15-30 секунд и показывает цепочки редиректов, коды ответа (301, 302, 404) и конкретные рекомендации по исправлению ошибок — без необходимости вручную тестировать каждый URL.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong>Результат:</strong> чистая структура редиректов, которую правильно индексируют Google, Yandex и generative AI-движки (ChatGPT, Perplexity).
              </p>
            </div>
          </section>

          {/* Кому нужен */}
          <section className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Кому нужен REDIRECT CHECKER</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <div className="text-purple-600 font-semibold mb-2">SEO-специалисты</div>
                <p className="text-sm text-gray-700">Проверяют технический аудит перед запуском сайта или после миграции</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <div className="text-purple-600 font-semibold mb-2">Веб-мастера</div>
                <p className="text-sm text-gray-700">Устраняют дублирование страниц и лишние цепочки редиректов</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <div className="text-purple-600 font-semibold mb-2">Владельцы сайтов</div>
                <p className="text-sm text-gray-700">Контролируют, что все версии URL (с www/без www, HTTP/HTTPS) ведут на одну каноническую</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <div className="text-purple-600 font-semibold mb-2">Digital-агентства</div>
                <p className="text-sm text-gray-700">Автоматизируют рутинные проверки для клиентских проектов</p>
              </div>
            </div>
          </section>

          {/* Как работает */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Как работает REDIRECT CHECKER</h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Шаг 1. Ввод URL</h3>
                <p className="text-gray-700 mb-3">Укажите домен (например, example.com) и выберите User-Agent:</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• <strong>Googlebot Desktop</strong> — для десктопной индексации</li>
                  <li>• <strong>Googlebot Smartphone</strong> — для mobile-first indexing</li>
                  <li>• <strong>Yandex Bot</strong> — для проверки поведения в Яндексе</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Шаг 2. Автоматическая проверка 11 сценариев</h3>
                <p className="text-gray-700 mb-4">Инструмент отправляет запросы и анализирует:</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left">№</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Сценарий</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Что проверяется</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">Код ответа</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr><td className="border border-gray-300 px-3 py-2">1</td><td className="border border-gray-300 px-3 py-2">HTTP → HTTPS</td><td className="border border-gray-300 px-3 py-2">Редирект с http:// на https://</td><td className="border border-gray-300 px-3 py-2 text-center">301 ✅</td></tr>
                      <tr className="bg-gray-50"><td className="border border-gray-300 px-3 py-2">2</td><td className="border border-gray-300 px-3 py-2">WWW vs без WWW</td><td className="border border-gray-300 px-3 py-2">Консистентность www.site.com ↔ site.com</td><td className="border border-gray-300 px-3 py-2 text-center">301 ✅</td></tr>
                      <tr><td className="border border-gray-300 px-3 py-2">3</td><td className="border border-gray-300 px-3 py-2">Множественные слеши</td><td className="border border-gray-300 px-3 py-2">Удаление // в URL</td><td className="border border-gray-300 px-3 py-2 text-center">301/200</td></tr>
                      <tr className="bg-gray-50"><td className="border border-gray-300 px-3 py-2">4</td><td className="border border-gray-300 px-3 py-2">Регистр URL</td><td className="border border-gray-300 px-3 py-2">/CART → /cart (lowercase)</td><td className="border border-gray-300 px-3 py-2 text-center">301 ✅</td></tr>
                      <tr><td className="border border-gray-300 px-3 py-2">5</td><td className="border border-gray-300 px-3 py-2">Index-файлы</td><td className="border border-gray-300 px-3 py-2">/index.html → /</td><td className="border border-gray-300 px-3 py-2 text-center">301 ✅</td></tr>
                      <tr className="bg-gray-50"><td className="border border-gray-300 px-3 py-2">6</td><td className="border border-gray-300 px-3 py-2">Trailing slash</td><td className="border border-gray-300 px-3 py-2">/page/ vs /page (единообразие)</td><td className="border border-gray-300 px-3 py-2 text-center">301/200</td></tr>
                      <tr><td className="border border-gray-300 px-3 py-2">7</td><td className="border border-gray-300 px-3 py-2">Старые расширения</td><td className="border border-gray-300 px-3 py-2">.html, .php → чистые URL</td><td className="border border-gray-300 px-3 py-2 text-center">301 ✅</td></tr>
                      <tr className="bg-gray-50"><td className="border border-gray-300 px-3 py-2">8</td><td className="border border-gray-300 px-3 py-2">Canonical тег</td><td className="border border-gray-300 px-3 py-2">&lt;link rel="canonical"&gt; на странице</td><td className="border border-gray-300 px-3 py-2 text-center">Presence ✅</td></tr>
                      <tr><td className="border border-gray-300 px-3 py-2">9</td><td className="border border-gray-300 px-3 py-2">404-страницы</td><td className="border border-gray-300 px-3 py-2">Корректный код для несуществующих URL</td><td className="border border-gray-300 px-3 py-2 text-center">404 ✅</td></tr>
                      <tr className="bg-gray-50"><td className="border border-gray-300 px-3 py-2">10</td><td className="border border-gray-300 px-3 py-2">Цепочки редиректов</td><td className="border border-gray-300 px-3 py-2">Обнаружение 2+ последовательных 301/302</td><td className="border border-gray-300 px-3 py-2 text-center">❌ Ошибка</td></tr>
                      <tr><td className="border border-gray-300 px-3 py-2">11</td><td className="border border-gray-300 px-3 py-2">User-Agent эмуляция</td><td className="border border-gray-300 px-3 py-2">Разница в ответах для bot/desktop/mobile</td><td className="border border-gray-300 px-3 py-2 text-center">Сравнение</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Шаг 3. Анализ результатов</h3>
                <p className="text-gray-700 mb-3">Инструмент показывает:</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✅ <strong>Passed</strong> — редирект настроен правильно (301, canonical присутствует)</li>
                  <li>⚠️ <strong>Warning</strong> — потенциальная проблема (302 вместо 301, цепочка из 2 редиректов)</li>
                  <li>❌ <strong>Error</strong> — критическая ошибка (отсутствие HTTPS-редиректа, 3+ цепочка)</li>
                </ul>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Шаг 4. Экспорт и исправление</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• <strong>CSV-экспорт</strong> — для передачи разработчикам</li>
                  <li>• <strong>Копирование в буфер</strong> — для вставки в отчёт</li>
                  <li>• <strong>Фильтрация</strong> — показать только ошибки или предупреждения</li>
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">FAQ — Часто задаваемые вопросы</h2>
            
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Почему важны редиректы для SEO?</h3>
                <p className="text-gray-700 leading-relaxed">
                  Неправильные редиректы (302 вместо 301, цепочки 3+ шагов) снижают краулинговый бюджет и размывают link equity — Google может не передавать вес ссылок через длинные цепочки. Canonical-теги предотвращают дублирование контента в индексе.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Что такое «цепочка редиректов» и почему она вредна?</h3>
                <p className="text-gray-700 leading-relaxed">
                  Цепочка — это когда URL A → URL B → URL C (2+ редиректа подряд). Google рекомендует максимум 1 редирект на путь — каждый дополнительный увеличивает время загрузки и риск потери индексации.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Какой код редиректа правильный: 301 или 302?</h3>
                <div className="space-y-3 text-gray-700">
                  <p>• <strong>301 Moved Permanently</strong> — для постоянного переезда страницы (передаёт ~90-99% link juice)</p>
                  <p>• <strong>302 Found</strong> — для временного редиректа (не передаёт вес, Google может индексировать старый URL)</p>
                  <p className="text-purple-700 font-medium">Для SEO всегда используйте 301, если перенос окончательный.</p>
                </div>
              </div>

              <div className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Зачем проверять canonical-теги?</h3>
                <p className="text-gray-700 leading-relaxed">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">&lt;link rel="canonical" href="..."&gt;</code> указывает Google, какая версия страницы главная (для дублей /page и /page/). Без canonical AI-движки (ChatGPT, Perplexity) могут цитировать неправильный URL.
                </p>
              </div>

              <div className="pb-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Как часто нужно проверять редиректы?</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>После миграции</strong> (смена домена, переезд на HTTPS)</li>
                  <li>• <strong>Раз в квартал</strong> — для выявления новых ошибок</li>
                  <li>• <strong>Перед техническим SEO-аудитом</strong></li>
                </ul>
              </div>
            </div>
          </section>

          {/* Преимущества */}
          <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Преимущества REDIRECT CHECKER</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Скорость</div>
                  <p className="text-sm text-gray-700">Проверка 11 сценариев за 15-30 секунд (вручную — 2-3 часа на 50 URL)</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Эмуляция User-Agent</div>
                  <p className="text-sm text-gray-700">Тестирование от имени Googlebot, Googlebot Smartphone, Yandex Bot</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Детальный лог</div>
                  <p className="text-sm text-gray-700">Коды ответа (301, 302, 200, 404), заголовки HTTP, финальный URL цепочки</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Экспорт</div>
                  <p className="text-sm text-gray-700">CSV для интеграции с Screaming Frog, Google Sheets, отчётами</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Resizable таблица</div>
                  <p className="text-sm text-gray-700">Изменяемая ширина колонок для удобного просмотра</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">100% бесплатно</div>
                  <p className="text-sm text-gray-700">Без регистрации, без лимитов, без скрытых платежей</p>
                </div>
              </div>
            </div>
          </section>

          {/* Сравнение с аналогами */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Сравнение с аналогами</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Критерий</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold bg-purple-50">REDIRECT CHECKER</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Screaming Frog</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Online Redirect Checker</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Проверка 11 сценариев</td>
                    <td className="border border-gray-300 px-4 py-3 bg-purple-50">✅ Все</td>
                    <td className="border border-gray-300 px-4 py-3">⚠️ Частично (нужна настройка)</td>
                    <td className="border border-gray-300 px-4 py-3">❌ 1-2 сценария</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">User-Agent эмуляция</td>
                    <td className="border border-gray-300 px-4 py-3 bg-purple-50">✅ 3 варианта</td>
                    <td className="border border-gray-300 px-4 py-3">✅ Настраивается</td>
                    <td className="border border-gray-300 px-4 py-3">❌ Нет</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Цена</td>
                    <td className="border border-gray-300 px-4 py-3 bg-purple-50">🆓 Бесплатно</td>
                    <td className="border border-gray-300 px-4 py-3">💰 $259/год (Lite)</td>
                    <td className="border border-gray-300 px-4 py-3">🆓 Бесплатно</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">Экспорт CSV</td>
                    <td className="border border-gray-300 px-4 py-3 bg-purple-50">✅ Да</td>
                    <td className="border border-gray-300 px-4 py-3">✅ Да</td>
                    <td className="border border-gray-300 px-4 py-3">⚠️ Ограничен</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Canonical-проверка</td>
                    <td className="border border-gray-300 px-4 py-3 bg-purple-50">✅ Да</td>
                    <td className="border border-gray-300 px-4 py-3">✅ Да</td>
                    <td className="border border-gray-300 px-4 py-3">❌ Нет</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Технические детали */}
          <section className="bg-gray-900 rounded-xl border border-gray-700 p-8 text-gray-100">
            <h2 className="text-2xl font-semibold text-white mb-6">Технические детали</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Что проверяется на уровне HTTP:</h3>
                <pre className="bg-gray-800 p-4 rounded-lg text-sm text-green-400 overflow-x-auto">
{`1. Status Code: 200, 301, 302, 404, 500
2. Headers: Location, Link (canonical), User-Agent
3. Redirect Chain: количество хопов A→B→C
4. Final URL: куда в итоге попадает запрос`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Рекомендации по исправлению ошибок:</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• <strong className="text-white">302 вместо 301</strong> → изменить .htaccess или nginx.conf</li>
                  <li>• <strong className="text-white">Цепочка 3+ редиректов</strong> → убрать промежуточные, сделать прямой 301</li>
                  <li>• <strong className="text-white">Отсутствие HTTPS</strong> → настроить SSL-сертификат + редирект с HTTP</li>
                  <li>• <strong className="text-white">Нет canonical</strong> → добавить <code className="bg-gray-800 px-2 py-1 rounded">&lt;link rel="canonical"&gt;</code> в <code className="bg-gray-800 px-2 py-1 rounded">&lt;head&gt;</code></li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Проверьте редиректы вашего сайта прямо сейчас</h2>
            <p className="text-lg text-purple-100 mb-6">
              Получите детальный отчёт с рекомендациями по исправлению за 30 секунд
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Начать проверку
            </button>
          </section>

          {/* Footer Info */}
          <section className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-600">
            <p className="mb-2">
              <strong className="text-gray-900">Автор:</strong> Игорь Бурдуков, SEO-специалист
            </p>
            <p className="mb-2">
              <strong className="text-gray-900">Обновлено:</strong> 16 декабря 2025
            </p>
            <p>
              <strong className="text-gray-900">Источники:</strong>{' '}
              <a 
                href="https://developers.google.com/search/docs/crawling-indexing/301-redirects" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 underline"
              >
                Google Search Central — редиректы
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
