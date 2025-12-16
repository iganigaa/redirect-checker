'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Home as HomeIcon, ChevronRight } from 'lucide-react';

interface Rule {
  type: string;
  path: string;
  hash: string;
  lineNumber: number;
}

interface AgentRules {
  userAgent: string;
  rules: Rule[];
  recommendations: string[];
  warnings: string[];
  errors: string[];
  cssJsBlocked: boolean;
  imagesBlocked: boolean;
  hasCleanParam: boolean;
  suggestedCleanParams: string[];
}

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
  agentRules: AgentRules[];
}

export default function RobotsTesterPage() {
  const [url, setUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [useManual, setUseManual] = useState(false);
  const [result, setResult] = useState<RobotsAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredHash, setHoveredHash] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'comparison' | 'detailed'>('comparison');

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

  const getRuleColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'disallow': 'text-red-600',
      'allow': 'text-green-600',
      'sitemap': 'text-blue-600',
      'clean-param': 'text-purple-600',
      'host': 'text-indigo-600',
      'crawl-delay': 'text-yellow-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const getAgentColor = (agent: string) => {
    const agentLower = agent.toLowerCase();
    if (agentLower.includes('google')) return 'border-blue-500 bg-blue-50';
    if (agentLower.includes('yandex')) return 'border-red-500 bg-red-50';
    if (agentLower.includes('bing')) return 'border-green-500 bg-green-50';
    return 'border-gray-500 bg-gray-50';
  };

  const getAgentIcon = (agent: string) => {
    const agentLower = agent.toLowerCase();
    if (agentLower.includes('google')) return '🔵';
    if (agentLower.includes('yandex')) return '🔴';
    if (agentLower.includes('bing')) return '🟢';
    if (agent === '*') return '⭐';
    return '🤖';
  };

  return (
    <div className="max-w-7xl mx-auto overflow-x-hidden">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link href="/" className="hover:text-purple-600 transition-colors">
          <HomeIcon className="w-4 h-4" />
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Robots Tester</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">
        Тестер robots.txt
      </h1>
      
      {/* Settings Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Настройки проверки</h2>
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
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://example.com"
                required={!useManual}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Текст robots.txt
              </label>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                placeholder="User-agent: *&#10;Disallow: /admin/"
                rows={6}
                required={useManual}
              />
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? 'Проверка...' : 'Проверить robots.txt'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {result && result.agentRules && (
        <div className="space-y-6">
          {/* Переключатель режима просмотра */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Режим просмотра:</span>
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'comparison'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔄 Сравнение
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'detailed'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 Детали
              </button>
            </div>
          </div>

          {/* Режим сравнения */}
          {viewMode === 'comparison' && (
            <div>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Наведите курсор на правило</strong>, чтобы подсветить одинаковые директивы у других ботов
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.agentRules.map((agent, index) => (
                  <div
                    key={index}
                    className={`border-l-4 rounded-lg shadow-sm p-6 ${getAgentColor(agent.userAgent)}`}
                  >
                    {/* Заголовок агента */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{getAgentIcon(agent.userAgent)}</span>
                      <h3 className="text-lg font-bold text-gray-900">
                        {agent.userAgent}
                      </h3>
                    </div>

                    {/* Правила */}
                    <div className="space-y-2 mb-4">
                      {agent.rules.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Нет директив</p>
                      ) : (
                        agent.rules.map((rule, rIndex) => (
                          <div
                            key={rIndex}
                            data-rule-hash={rule.hash}
                            onMouseEnter={() => setHoveredHash(rule.hash)}
                            onMouseLeave={() => setHoveredHash(null)}
                            className={`p-2 rounded-lg text-sm font-mono transition-all duration-200 cursor-pointer ${
                              hoveredHash === rule.hash
                                ? 'bg-yellow-100 ring-2 ring-amber-400 transform scale-105'
                                : 'bg-white hover:bg-gray-50'
                            } ${getRuleColor(rule.type)}`}
                          >
                            <div className="font-semibold">{rule.type}:</div>
                            <div className="text-gray-700 break-all">{rule.path}</div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Ошибки */}
                    {agent.errors.length > 0 && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="font-semibold text-red-900 text-sm mb-1">❌ Ошибки:</div>
                        <ul className="text-xs text-red-800 space-y-1">
                          {agent.errors.map((err, eIndex) => (
                            <li key={eIndex}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Предупреждения */}
                    {agent.warnings.length > 0 && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-semibold text-yellow-900 text-sm mb-1">⚠️ Предупреждения:</div>
                        <ul className="text-xs text-yellow-800 space-y-1">
                          {agent.warnings.map((warning, wIndex) => (
                            <li key={wIndex}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Рекомендации */}
                    {agent.recommendations.length > 0 && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-semibold text-green-900 text-sm mb-1">💡 Рекомендации:</div>
                        <ul className="text-xs text-green-800 space-y-1">
                          {agent.recommendations.map((rec, rIndex) => (
                            <li key={rIndex}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggested Clean-param */}
                    {agent.suggestedCleanParams.length > 0 && !agent.hasCleanParam && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="font-semibold text-purple-900 text-sm mb-1">🔧 Предложение:</div>
                        <code className="text-xs text-purple-800 break-all">
                          Clean-param: {agent.suggestedCleanParams.join('&')}
                        </code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
