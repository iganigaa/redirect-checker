'use client';

import { useState, useEffect } from 'react';
import { Search, Key, AlertCircle, ExternalLink, Download, Copy, Check, Home as HomeIcon, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface KGEntity {
  '@type': string[];
  name: string;
  description?: string;
  detailedDescription?: {
    articleBody: string;
    url: string;
  };
  image?: {
    contentUrl: string;
  };
  url?: string;
  result: {
    '@id': string;
  };
  resultScore?: number;
}

const ENTITY_TYPES = [
  { value: '', label: 'Любой тип' },
  { value: 'Person', label: 'Персона' },
  { value: 'Organization', label: 'Организация' },
  { value: 'LocalBusiness', label: 'Местный бизнес' },
  { value: 'Place', label: 'Место' },
  { value: 'Event', label: 'Событие' },
  { value: 'WebSite', label: 'Веб-сайт' },
  { value: 'Movie', label: 'Фильм' },
  { value: 'MusicGroup', label: 'Музыкальная группа' },
  { value: 'Book', label: 'Книга' },
  { value: 'Product', label: 'Товар' },
];

const LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
];

export default function KnowledgeGraphPage() {
  const [apiKey, setApiKey] = useState('');
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState('');
  const [language, setLanguage] = useState('en');
  const [results, setResults] = useState<KGEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('kg_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('kg_api_key', apiKey.trim());
      setShowApiKeyInput(false);
      setError('');
    }
  };

  const handleSearch = async () => {
    if (!apiKey.trim()) {
      setError('Необходимо добавить API ключ');
      setShowApiKeyInput(true);
      return;
    }

    if (!query.trim()) {
      setError('Введите поисковый запрос');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      let url = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodeURIComponent(query)}&key=${apiKey}&limit=20&languages=${language}`;
      
      if (entityType) {
        url += `&types=${entityType}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Ошибка при запросе к API');
      }

      const data = await response.json();
      
      if (data.itemListElement && data.itemListElement.length > 0) {
        setResults(data.itemListElement.map((item: any) => ({
          ...item.result,
          resultScore: item.resultScore
        })));
      } else {
        setError('Ничего не найдено');
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при поиске');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTable = () => {
    const headers = ['Название', 'Тип', 'Описание', 'KGID', 'Релевантность', 'URL', 'Изображение', 'Подробнее'];
    const rows = results.map(entity => [
      entity.name,
      entity['@type']?.join(', ') || '-',
      entity.description || '-',
      entity.result['@id'] || '-',
      entity.resultScore?.toFixed(0) || '-',
      entity.url || '-',
      entity.image?.contentUrl || '-',
      entity.detailedDescription?.url || '-'
    ]);

    const text = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const headers = ['Название', 'Тип', 'Описание', 'KGID', 'Релевантность', 'URL', 'Изображение', 'Подробнее'];
    const rows = results.map(entity => [
      entity.name,
      entity['@type']?.join(', ') || '-',
      entity.description || '-',
      entity.result['@id'] || '-',
      entity.resultScore?.toFixed(0) || '-',
      entity.url || '-',
      entity.image?.contentUrl || '-',
      entity.detailedDescription?.url || '-'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `knowledge-graph-${query}-${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto overflow-x-hidden">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link href="/" className="hover:text-purple-600 transition-colors">
          <HomeIcon className="w-4 h-4" />
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Knowledge Graph</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">
        Поиск по графу знаний Google
      </h1>

      {/* API Key Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-semibold text-gray-900">API Ключ</h2>
          </div>
          {apiKey && !showApiKeyInput && (
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Изменить
            </button>
          )}
        </div>

        {(!apiKey || showApiKeyInput) && (
          <div className="space-y-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Введите ваш Google Knowledge Graph API ключ"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                Сохранить ключ
              </button>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium inline-flex items-center gap-2"
              >
                Получить API ключ
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-gray-500">
              Ключ сохраняется локально в вашем браузере и не передаётся на сервер
            </p>
          </div>
        )}

        {apiKey && !showApiKeyInput && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            API ключ сохранён
          </div>
        )}
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Настройки поиска</h3>
        
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Запрос
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Например: Apple"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип сущности
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                {ENTITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Язык результатов
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !apiKey}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium inline-flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          {loading ? 'Поиск...' : 'Получить результаты'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Результаты ({results.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleCopyTable}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium inline-flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Скопировано' : 'Копировать'}
              </button>
              <button
                onClick={handleDownloadCSV}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Скачать CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50">Название</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50">Тип</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50">Описание</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50">KGID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50">Релевантность</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50">URL</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50">Изображение</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50">Подробнее</th>
                </tr>
              </thead>
              <tbody>
                {results.map((entity, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{entity.name}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {entity['@type']?.map(t => t.replace(/Thing$/, 'Общий')).join(', ') || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                      {entity.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                      {entity.result['@id'] || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-semibold">
                      {entity.resultScore?.toFixed(0) || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {entity.url ? (
                        <a
                          href={entity.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
                        >
                          Сайт
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {entity.image?.contentUrl ? (
                        <a
                          href={entity.image.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
                        >
                          Фото
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {entity.detailedDescription?.url ? (
                        <a
                          href={entity.detailedDescription.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
                        >
                          Wiki
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
