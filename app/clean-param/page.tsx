'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Home as HomeIcon, ChevronRight, Copy, Download } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto overflow-x-hidden">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link href="/" className="hover:text-purple-600 transition-colors">
          <HomeIcon className="w-4 h-4" />
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Clean-param</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">
        Генератор Clean-param для robots.txt
      </h1>

      {/* Settings Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Настройки проверки</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Список URL (по одному на строку)
            </label>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              placeholder="https://site.ru/catalog?page=2&sort=asc&#10;https://site.ru/catalog?page=3&sort=desc&#10;https://site.ru/product?id=123&utm_source=yandex"
              rows={8}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Вставьте URL с GET-параметрами
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Анализ...' : 'Сгенерировать директивы'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2 text-sm">💡 Что делает Clean-param?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Указывает Яндексу игнорировать указанные параметры</li>
          <li>• Уменьшает дубли страниц в индексе</li>
          <li>• Экономит краулинговый бюджет</li>
          <li>• Работает только для Яндекса (не для Google)</li>
        </ul>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Готовый блок для robots.txt */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                🎯 Готовый блок для robots.txt
              </h2>
              <button
                onClick={() => copyToClipboard(robotsTxt)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                Скопировать
              </button>
            </div>
            
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
{robotsTxt}
            </pre>
          </div>

          {/* Таблица категорий */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Классификация параметров
            </h2>
            
            <div className="space-y-4">
              {/* Аналитика */}
              {result.groups.analytics.length > 0 && (
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
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
                <div className="border-l-4 border-yellow-500 pl-4 py-2">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
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
                <div className="border-l-4 border-red-500 pl-4 py-2">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
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
              <h3 className="font-semibold text-yellow-900 mb-2 text-sm">⚠️ Предупреждения</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                {result.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Рекомендации */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">📚 Рекомендации</h3>
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
  );
}
