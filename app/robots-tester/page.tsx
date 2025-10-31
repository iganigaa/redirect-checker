'use client';

import { useState } from 'react';
import axios from 'axios';

interface CheckResult {
  category: string;
  check: string;
  status: '✅' | '⚠️' | '❌' | 'ℹ️';
  message: string;
  recommendation?: string;
}

interface RobotsAnalysis {
  url: string;
  robotsText: string;
  checks: CheckResult[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    errors: number;
  };
  userAgents: string[];
  sitemaps: string[];
  hasHost: boolean;
  hasCleanParam: boolean;
}

export default function RobotsTesterPage() {
  const [url, setUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [useManual, setUseManual] = useState(false);
  const [result, setResult] = useState<RobotsAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await axios.post('/api/robots-tester', {
        url: useManual ? null : url,
        robotsText: useManual ? manualText : null
      });
      
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при проверке robots.txt');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '✅': return 'text-green-600';
      case '⚠️': return 'text-yellow-600';
      case '❌': return 'text-red-600';
      case 'ℹ️': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Технические проверки': '🔧',
      'Синтаксис и валидность': '📝',
      'Семантические проверки': '🧠',
      'Доступ к ресурсам': '📁',
      'Общая информация': 'ℹ️'
    };
    return icons[category] || '📋';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Тестер robots.txt
          </h1>
          <p className="text-gray-600">
            Комплексная проверка корректности и эффективности файла robots.txt
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Левая колонка - ввод */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Настройки проверки</h2>
              
              <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useManual}
                    onChange={(e) => setUseManual(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Вставить текст вручную</span>
                </label>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!useManual ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL сайта
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com"
                      required={!useManual}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Автоматически загрузит /robots.txt
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Текст robots.txt
                    </label>
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="User-agent: *&#10;Disallow: /admin/&#10;&#10;Sitemap: https://example.com/sitemap.xml"
                      rows={10}
                      required={useManual}
                    />
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? 'Проверка...' : '🔍 Проверить robots.txt'}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Справка */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm">💡 Что проверяется?</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Доступность и код ответа</li>
                  <li>• Синтаксис директив</li>
                  <li>• Наличие Sitemap и Host</li>
                  <li>• Конфликты Allow/Disallow</li>
                  <li>• Доступ к CSS/JS</li>
                  <li>• Размер файла и кодировка</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Правая колонка - результат */}
          {result && (
            <div className="md:col-span-2 space-y-6">
              {/* Сводка */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Сводка</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{result.summary.total}</div>
                    <div className="text-xs text-gray-600">Всего проверок</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.summary.passed}</div>
                    <div className="text-xs text-gray-600">Пройдено</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{result.summary.warnings}</div>
                    <div className="text-xs text-gray-600">Предупреждений</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{result.summary.errors}</div>
                    <div className="text-xs text-gray-600">Ошибок</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">User-agents:</span> {result.userAgents.length > 0 ? result.userAgents.join(', ') : 'не указаны'}
                  </div>
                  <div>
                    <span className="font-semibold">Sitemap:</span> {result.sitemaps.length > 0 ? `${result.sitemaps.length} шт.` : '❌ отсутствует'}
                  </div>
                  <div>
                    <span className="font-semibold">Host:</span> {result.hasHost ? '✅ указан' : '⚠️ отсутствует'}
                  </div>
                  <div>
                    <span className="font-semibold">Clean-param:</span> {result.hasCleanParam ? '✅ найден' : 'ℹ️ отсутствует'}
                  </div>
                </div>
              </div>

              {/* Текст robots.txt */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📄 Содержимое robots.txt</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-64">
{result.robotsText || 'Пусто'}
                </pre>
              </div>

              {/* Результаты проверок по категориям */}
              {Object.entries(
                result.checks.reduce((acc, check) => {
                  if (!acc[check.category]) acc[check.category] = [];
                  acc[check.category].push(check);
                  return acc;
                }, {} as { [key: string]: CheckResult[] })
              ).map(([category, checks]) => (
                <div key={category} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {getCategoryIcon(category)} {category}
                  </h3>
                  
                  <div className="space-y-3">
                    {checks.map((check, index) => (
                      <div key={index} className="border-l-4 pl-4 py-2" style={{
                        borderColor: check.status === '✅' ? '#10b981' : 
                                    check.status === '⚠️' ? '#f59e0b' :
                                    check.status === '❌' ? '#ef4444' : '#3b82f6'
                      }}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xl ${getStatusColor(check.status)}`}>
                                {check.status}
                              </span>
                              <span className="font-medium text-gray-900">{check.check}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                            {check.recommendation && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                                💡 {check.recommendation}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* SEO рекомендации */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">🎯 Общие рекомендации</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>✓ Регулярно проверяйте robots.txt после изменений на сайте</li>
                  <li>✓ Используйте инструменты проверки в Яндекс.Вебмастере и Google Search Console</li>
                  <li>✓ Не блокируйте важные ресурсы (CSS, JS, изображения)</li>
                  <li>✓ Указывайте актуальные sitemap.xml</li>
                  <li>✓ Для Яндекса обязательно добавьте директиву Host</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
