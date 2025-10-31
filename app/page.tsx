'use client';

import { useState } from 'react';
import axios from 'axios';

interface Result {
  number: number;
  checkName: string;
  url: string;
  expected: string;
  statusCode: number | null;
  redirectChain: string[];
  status: '✅' | '❌' | '⚠️';
  message: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [userAgent, setUserAgent] = useState('Googlebot Smartphone');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const successCount = results.filter(r => r.status === '✅').length;
  const warningCount = results.filter(r => r.status === '⚠️').length;
  const errorCount = results.filter(r => r.status === '❌').length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Проверка основных редиректов сайта
          </h1>
          <p className="text-gray-600">
            Комплексная проверка редиректов по 11 критериям
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Настройки</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Основной адрес сайта
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User-Agent
              </label>
              <select
                value={userAgent}
                onChange={(e) => setUserAgent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option>Googlebot Smartphone</option>
                <option>Googlebot Desktop</option>
                <option>YandexBot</option>
                <option>BingBot</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? 'Проверка...' : 'Проверить сайт'}
              </button>
              
              {loading && (
                <span className="text-gray-500 text-sm">≈ 1-2 минуты</span>
              )}
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>
        
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Результаты проверки</h2>
              <div className="flex gap-6 text-sm">
                <span className="text-green-600 font-medium">
                  ✅ Всё ок: {successCount}
                </span>
                <span className="text-yellow-600 font-medium">
                  ⚠️ Предупреждения: {warningCount}
                </span>
                <span className="text-red-600 font-medium">
                  ❌ Ошибки: {errorCount}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">№</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Проверка</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">URL</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ожидается</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Код</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Статус</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Результат</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {result.number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {result.checkName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 break-all max-w-xs">
                        <div className="truncate" title={result.url}>
                          {result.url}
                        </div>
                        {result.redirectChain.length > 1 && (
                          <details className="text-xs text-gray-500 mt-1">
                            <summary className="cursor-pointer">Цепочка ({result.redirectChain.length})</summary>
                            <div className="mt-1 pl-2 border-l-2 border-gray-300">
                              {result.redirectChain.map((link, i) => (
                                <div key={i} className="truncate">{i + 1}. {link}</div>
                              ))}
                            </div>
                          </details>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {result.expected}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {result.statusCode || '—'}
                      </td>
                      <td className="px-4 py-3 text-2xl">
                        {result.status}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {result.message}
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
