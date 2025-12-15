'use client';

import { useState } from 'react';
import axios from 'axios';
import Breadcrumbs from '@/components/Breadcrumbs';

interface ParamGroup {
  type: 'analytics' | 'navigation' | 'content';
  params: string[];
  paths: string[];
}

interface Result {
  groups: {
    analytics: string[];
    navigation: { [path: string]: string[] };
    content: string[];
  };
  directives: string[];
  warnings: string[];
}

export default function CleanParamPage() {
  const [urls, setUrls] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await axios.post('/api/clean-param', {
        urls: urls.split('\n').filter(u => u.trim())
      });
      
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при обработке URL');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Скопировано в буфер обмена!');
  };

  const robotsTxt = result ? `User-agent: Yandex\n${result.directives.join('\n')}` : '';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Clean-param' }]} />
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Генератор Clean-param для robots.txt
          </h1>
          <p className="text-gray-600">
            Автоматический анализ GET-параметров и генерация директив для Яндекса
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Левая колонка - ввод */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Входные данные</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Список URL (по одному на строку)
                </label>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="https://site.ru/catalog?page=2&sort=asc&#10;https://site.ru/catalog?page=3&sort=desc&#10;https://site.ru/product?id=123&utm_source=yandex"
                  rows={12}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Вставьте URL с GET-параметрами
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? 'Анализ...' : 'Сгенерировать директивы'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Справка */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Что делает Clean-param?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Указывает Яндексу игнорировать указанные параметры</li>
                <li>• Уменьшает дубли страниц в индексе</li>
                <li>• Экономит краулинговый бюджет</li>
                <li>• Работает только для Яндекса (не для Google)</li>
              </ul>
            </div>
          </div>

          {/* Правая колонка - результат */}
          {result && (
            <div className="space-y-6">
              {/* Готовый блок для robots.txt */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    🎯 Готовый блок для robots.txt
                  </h2>
                  <button
                    onClick={() => copyToClipboard(robotsTxt)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    📋 Скопировать
                  </button>
                </div>
                
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
{robotsTxt}
                </pre>
              </div>

              {/* Таблица категорий */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  📊 Классификация параметров
                </h2>
                
                <div className="space-y-4">
                  {/* Аналитика */}
                  {result.groups.analytics.length > 0 && (
                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        🟢 Аналитика и метки
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Параметры: {result.groups.analytics.join(', ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Применяется ко всем страницам. Безопасно добавлять.
                      </p>
                    </div>
                  )}

                  {/* Навигация */}
                  {Object.keys(result.groups.navigation).length > 0 && (
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        🟡 Навигация и сортировка
                      </h3>
                      {Object.entries(result.groups.navigation).map(([path, params]) => (
                        <div key={path} className="mb-2">
                          <p className="text-sm text-gray-600">
                            Параметры: {params.join(', ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Применяется к: {path}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Содержательные */}
                  {result.groups.content.length > 0 && (
                    <div className="border-l-4 border-red-500 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        🔴 Содержательные параметры
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Параметры: {result.groups.content.join(', ')}
                      </p>
                      <p className="text-xs text-red-600">
                        НЕ добавлены в директивы, т.к. влияют на контент страницы.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Предупреждения */}
              {result.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Предупреждения</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {result.warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Рекомендации */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📚 Рекомендации</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>✓ Директива действует только для Яндекса</li>
                  <li>✓ Не заменяет canonical - используйте оба метода</li>
                  <li>✓ Проверьте результат в Яндекс.Вебмастере через 1-2 недели</li>
                  <li>✓ Лимит 500 символов на одну директиву</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
