'use client';

import { useState, useEffect } from 'react';
import { Search, Key, AlertCircle, ExternalLink } from 'lucide-react';

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
  const [language, setLanguage] = useState('ru');
  const [results, setResults] = useState<KGEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

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
        setResults(data.itemListElement.map((item: any) => item.result));
      } else {
        setError('Ничего не найдено');
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при поиске');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Поиск по графу знаний Google
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Поиск сущностей в Google Knowledge Graph API
        </p>
      </div>

      {/* API Key Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">API Ключ</h2>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <div className="flex gap-2">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Поисковый запрос
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Например: Илон Маск"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип сущности
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            >
              {ENTITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Язык результатов
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !apiKey}
          className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium inline-flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          {loading ? 'Поиск...' : 'Найти'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Найдено результатов: {results.length}
          </h2>

          <div className="space-y-4">
            {results.map((entity, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
              >
                <div className="flex gap-4">
                  {entity.image?.contentUrl && (
                    <img
                      src={entity.image.contentUrl}
                      alt={entity.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {entity.name}
                    </h3>
                    {entity['@type'] && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {entity['@type'].map((type, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                    {entity.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {entity.description}
                      </p>
                    )}
                    {entity.detailedDescription && (
                      <div className="text-sm text-gray-700 mb-2">
                        {entity.detailedDescription.articleBody.substring(0, 200)}
                        {entity.detailedDescription.articleBody.length > 200 && '...'}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {entity.url && (
                        <a
                          href={entity.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
                        >
                          Официальный сайт
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {entity.detailedDescription?.url && (
                        <a
                          href={entity.detailedDescription.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
                        >
                          Подробнее
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
