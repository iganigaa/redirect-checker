'use client';

import React, { useState } from 'react';
import { Upload, Download, TrendingUp, Info, Home as HomeIcon, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface GroupedPosition {
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
  results: GroupedPosition[];
  summary: {
    currentTraffic: number;
    realisticTraffic: number;
    optimisticTraffic: number;
    realisticGrowth: number;
    optimisticGrowth: number;
    realisticGrowthPercent: number;
    optimisticGrowthPercent: number;
  };
}

export default function TrafficCalculatorPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [minGrowth, setMinGrowth] = useState<number>(0);
  const [maxGrowth, setMaxGrowth] = useState<number>(0);
  const [newQueries, setNewQueries] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleCalculate = async () => {
    if (!csvFile) {
      setError('Пожалуйста, загрузите CSV файл');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('minGrowth', minGrowth.toString());
      formData.append('maxGrowth', maxGrowth.toString());
      formData.append('newQueries', newQueries.toString());

      const response = await fetch('/api/traffic-calculator', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при расчете');
      }

      const data: CalculationResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const downloadExampleCSV = () => {
    const exampleData = `Популярные запросы,Клики,Показы,CTR,Позиция
rush academy,319,579,55.09%,7
раш академия,100,137,72.99%,1
rush academy seo,30,53,56.6%,1
seo стажировка,14,152,9.21%,8
seo курсы бесплатно,9,762,1.18%,5`;

    const blob = new Blob([exampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'example_gsc_data.csv';
    link.click();
  };

  const exportResults = () => {
    if (!result) return;

    let csvContent = 'Позиция,Count,Ktraf,CTR,Real count,Opt count,Ktraf real,Ktraf opt\n';
    result.results.forEach(row => {
      csvContent += `${row.position},${row.count},${row.ktraf.toFixed(4)},${row.ctr.toFixed(2)},${row.realCount},${row.optCount},${row.ktrafReal.toFixed(4)},${row.ktrafOpt.toFixed(4)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'traffic_forecast_results.csv';
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
        <span className="text-gray-900 font-medium">Traffic Calculator</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">
        Калькулятор SEO трафика
      </h1>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-2 items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-2">Как использовать:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Загрузите CSV из Google Search Console с колонками: Запросы, Клики, Показы, CTR, Позиция</li>
              <li>Укажите минимальный и максимальный рост средней позиции в процентах</li>
              <li>Добавьте количество новых запросов (опционально)</li>
              <li>Получите прогноз реалистичного и оптимистичного сценариев</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Настройки расчета</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CSV файл с позициями *</label>
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 transition-colors">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">
                      {csvFile ? csvFile.name : 'Выберите файл или перетащите сюда'}
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Формат: Позиция, CTR (например: 1, 35.5%)
            </p>
            <button
              onClick={downloadExampleCSV}
              className="mt-2 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Скачать пример CSV
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Минимальный рост средней позиции (%)
              </label>
              <input
                type="number"
                value={minGrowth}
                onChange={(e) => setMinGrowth(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
                step="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Реалистичный сценарий улучшения позиций
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Максимальный рост средней позиции (%)
              </label>
              <input
                type="number"
                value={maxGrowth}
                onChange={(e) => setMaxGrowth(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
                step="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Оптимистичный сценарий улучшения позиций
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Количество новых запросов
            </label>
            <input
              type="number"
              value={newQueries}
              onChange={(e) => setNewQueries(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading || !csvFile}
          className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-5 h-5" />
          {loading ? 'Расчет...' : 'Рассчитать прогноз'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Общие итоги</h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Текущий трафик (Ktraf)</div>
                <div className="text-3xl font-bold text-gray-900">
                  {result.summary.currentTraffic.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">тысяч посетителей</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Реалистичный прогноз</div>
                <div className="text-3xl font-bold text-blue-600">
                  {result.summary.realisticTraffic.toFixed(2)}
                </div>
                <div className="text-sm text-blue-600 mt-1 font-semibold">
                  +{result.summary.realisticGrowthPercent.toFixed(2)}%
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <div className="text-sm text-gray-600 mb-1">Оптимистичный прогноз</div>
                <div className="text-3xl font-bold text-green-600">
                  {result.summary.optimisticTraffic.toFixed(2)}
                </div>
                <div className="text-sm text-green-600 mt-1 font-semibold">
                  +{result.summary.optimisticGrowthPercent.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Что это значит?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Текущая ситуация:</strong> Ваши запросы приносят около {result.summary.currentTraffic.toFixed(0)} тысяч посетителей в месяц</li>
                <li>• <strong>Реалистичный прогноз:</strong> Трафик может вырасти до {result.summary.realisticTraffic.toFixed(0)} тысяч (+{result.summary.realisticGrowthPercent.toFixed(0)}%)</li>
                <li>• <strong>Оптимистичный прогноз:</strong> В лучшем случае до {result.summary.optimisticTraffic.toFixed(0)} тысяч (+{result.summary.optimisticGrowthPercent.toFixed(0)}%)</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Детальная таблица</h2>
              <button
                onClick={exportResults}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Экспорт CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left">Позиция</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">Count</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">CTR (%)</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">Ktraf</th>
                    <th className="border border-gray-300 px-3 py-2 text-right bg-blue-50">Real count</th>
                    <th className="border border-gray-300 px-3 py-2 text-right bg-green-50">Opt count</th>
                    <th className="border border-gray-300 px-3 py-2 text-right bg-blue-50">Ktraf real</th>
                    <th className="border border-gray-300 px-3 py-2 text-right bg-green-50">Ktraf opt</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 font-semibold">{row.position}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">{row.count}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">{row.ctr.toFixed(2)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">{row.ktraf.toFixed(4)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right bg-blue-50">{row.realCount}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right bg-green-50">{row.optCount}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right bg-blue-50 font-semibold">{row.ktrafReal.toFixed(4)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right bg-green-50 font-semibold">{row.ktrafOpt.toFixed(4)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={3} className="border border-gray-300 px-3 py-2">ИТОГО</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">{result.summary.currentTraffic.toFixed(2)}</td>
                    <td colSpan={2} className="border border-gray-300 px-3 py-2"></td>
                    <td className="border border-gray-300 px-3 py-2 text-right bg-blue-100">{result.summary.realisticTraffic.toFixed(2)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right bg-green-100">{result.summary.optimisticTraffic.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-lg text-xs text-gray-600">
              <h4 className="font-semibold text-gray-900 mb-2">Объяснение колонок:</h4>
              <div className="grid md:grid-cols-2 gap-2">
                <div><strong>Count</strong> - количество запросов на позиции</div>
                <div><strong>CTR</strong> - медиана кликабельности</div>
                <div><strong>Ktraf</strong> - текущий трафик (тыс.)</div>
                <div><strong>Real count</strong> - реалистичный прогноз запросов</div>
                <div><strong>Opt count</strong> - оптимистичный прогноз запросов</div>
                <div><strong>Ktraf real/opt</strong> - прогноз трафика</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
