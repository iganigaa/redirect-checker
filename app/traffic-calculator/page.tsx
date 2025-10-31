'use client';

import { useState } from 'react';
import axios from 'axios';

interface PositionData {
  position: number;
  count: number;
  ctr: number;
  ktraf: number;
  realCount: number;
  optCount: number;
  ktrafReal: number;
  ktrafOpt: number;
}

interface CalculationResult {
  summary: PositionData[];
  currentMeanPosition: number;
  realisticMeanPosition: number;
  optimisticMeanPosition: number;
  currentTraffic: number;
  realisticTraffic: number;
  optimisticTraffic: number;
  realisticGrowth: number;
  optimisticGrowth: number;
}

export default function TrafficCalculatorPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [newQueriesFile, setNewQueriesFile] = useState<File | null>(null);
  const [minGrowth, setMinGrowth] = useState<number>(0);
  const [maxGrowth, setMaxGrowth] = useState<number>(0);
  const [newQueries, setNewQueries] = useState<number>(0);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile) {
      setError('Загрузите CSV файл с данными позиций');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('csvFile', csvFile);
    if (newQueriesFile) {
      formData.append('newQueriesFile', newQueriesFile);
    }
    formData.append('minGrowth', minGrowth.toString());
    formData.append('maxGrowth', maxGrowth.toString());
    formData.append('newQueries', newQueries.toString());

    try {
      const response = await axios.post('/api/traffic-calculator', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при расчете');
    } finally {
      setLoading(false);
    }
  };

  const downloadExample = () => {
    const exampleData = 'Позиция,CTR\n1,35.5%\n2,15.2%\n3,10.1%\n4,7.5%\n5,5.2%';
    const blob = new Blob([exampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'example.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Калькулятор SEO трафика
          </h1>
          <p className="text-gray-600">
            Прогноз изменения органического трафика на основе роста позиций
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Левая колонка - ввод */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Входные данные</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Основной CSV */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSV файл с позициями *
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Формат: Позиция, CTR (например: 1, 35.5%)
                  </p>
                  <button
                    type="button"
                    onClick={downloadExample}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    📥 Скачать пример CSV
                  </button>
                </div>

                {/* Минимальный рост позиций */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Минимальный рост средней позиции (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={minGrowth}
                    onChange={(e) => setMinGrowth(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: 10"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Реалистичный сценарий улучшения позиций
                  </p>
                </div>

                {/* Максимальный рост позиций */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Максимальный рост средней позиции (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={maxGrowth}
                    onChange={(e) => setMaxGrowth(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: 25"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Оптимистичный сценарий улучшения позиций
                  </p>
                </div>

                {/* Новые запросы */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество новых запросов
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={newQueries}
                    onChange={(e) => setNewQueries(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: 100"
                  />
                </div>

                {/* CSV с новыми запросами (опционально) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSV с новыми запросами (необязательно)
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setNewQueriesFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Если не указано количество выше, можно загрузить CSV
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {loading ? 'Расчет...' : '📊 Рассчитать прогноз'}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Справка */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Как использовать?</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>1. Загрузите CSV с текущими позициями и CTR</li>
                <li>2. Укажите ожидаемый рост позиций в %</li>
                <li>3. Добавьте количество новых запросов (опционально)</li>
                <li>4. Получите прогноз трафика</li>
              </ul>
            </div>
          </div>

          {/* Правая колонка - результаты */}
          {result && (
            <div className="space-y-6">
              {/* Сводка */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">📈 Прогноз трафика</h2>
                
                <div className="space-y-4">
                  {/* Текущие показатели */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Текущая средняя позиция</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {result.currentMeanPosition.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">Текущий трафик (условный)</div>
                    <div className="text-xl font-semibold text-gray-700">
                      {result.currentTraffic.toFixed(0)}
                    </div>
                  </div>

                  {/* Реалистичный сценарий */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-green-900">
                        Реалистичный сценарий
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        +{result.realisticGrowth.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-sm text-green-800">
                      Средняя позиция: {result.realisticMeanPosition.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-800">
                      Прогноз трафика: {result.realisticTraffic.toFixed(0)}
                    </div>
                  </div>

                  {/* Оптимистичный сценарий */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-blue-900">
                        Оптимистичный сценарий
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        +{result.optimisticGrowth.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-sm text-blue-800">
                      Средняя позиция: {result.optimisticMeanPosition.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-800">
                      Прогноз трафика: {result.optimisticTraffic.toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Таблица по позициям */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Распределение по позициям
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Поз.</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Сейчас</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">CTR%</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Реал.</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Опт.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.summary.map((row, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {row.position}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {row.count}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {row.ctr.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 font-medium">
                            {row.realCount}
                          </td>
                          <td className="px-4 py-3 text-right text-blue-600 font-medium">
                            {row.optCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
