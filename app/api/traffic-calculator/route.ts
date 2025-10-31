import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const csvFile = formData.get('csvFile') as File;
    const newQueriesFile = formData.get('newQueriesFile') as File | null;
    const minGrowth = parseFloat(formData.get('minGrowth') as string) || 0;
    const maxGrowth = parseFloat(formData.get('maxGrowth') as string) || 0;
    let newQueries = parseInt(formData.get('newQueries') as string) || 0;

    if (!csvFile) {
      return NextResponse.json({ error: 'CSV файл обязателен' }, { status: 400 });
    }

    // Парсим основной CSV
    const csvText = await csvFile.text();
    const data = parseCSV(csvText);

    // Если есть файл с новыми запросами и не указано количество
    if (newQueries === 0 && newQueriesFile) {
      const newQueriesText = await newQueriesFile.text();
      const newQueriesData = parseCSV(newQueriesText);
      newQueries = newQueriesData.reduce((sum, row) => {
        const count = parseInt(row['Количество'] || row['количество'] || '0');
        return sum + count;
      }, 0);
    }

    // Обработка данных
    const result = calculateTraffic(data, minGrowth, maxGrowth, newQueries);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Ошибка при расчете' 
    }, { status: 500 });
  }
}

function parseCSV(text: string): any[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    return row;
  });
}

function calculateTraffic(data: any[], minGrowth: number, maxGrowth: number, newQueries: number) {
  // Фильтруем и обрабатываем данные
  const processedData = data
    .map(row => ({
      position: Math.round(parseFloat(row['Позиция'] || row['position'] || '0')),
      ctr: parseFloat((row['CTR'] || row['ctr'] || '0').toString().replace('%', ''))
    }))
    .filter(row => row.position >= 1 && row.position <= 10);

  // Группируем по позициям
  const grouped: { [key: number]: { count: number; ctrs: number[] } } = {};
  
  processedData.forEach(row => {
    if (!grouped[row.position]) {
      grouped[row.position] = { count: 0, ctrs: [] };
    }
    grouped[row.position].count++;
    grouped[row.position].ctrs.push(row.ctr);
  });

  // Создаем сводку
  const summary = Object.entries(grouped)
    .map(([pos, data]) => ({
      position: parseInt(pos),
      count: data.count,
      ctr: median(data.ctrs),
      ktraf: data.count * (median(data.ctrs) / 100)
    }))
    .sort((a, b) => a.position - b.position);

  // Расчет средней позиции
  const totalCount = summary.reduce((sum, row) => sum + row.count, 0);
  const currentMeanPosition = summary.reduce((sum, row) => sum + (row.position * row.count), 0) / totalCount;

  // Преобразование процентов в целевые средние позиции
  const realisticMeanPosition = currentMeanPosition * (1 - minGrowth / 100);
  const optimisticMeanPosition = currentMeanPosition * (1 - maxGrowth / 100);

  // Расчет сдвигов
  const counts = summary.map(r => r.count);
  const p1 = counts[0] / totalCount;

  const calcShift = (targetMean: number) => {
    const delta = currentMeanPosition - targetMean;
    const s = delta / (1 - p1);
    return Math.min(Math.max(s, 0), 1);
  };

  const sRealistic = calcShift(realisticMeanPosition);
  const sOptimistic = calcShift(optimisticMeanPosition);

  // Применяем сдвиги
  const shiftCounts = (s: number) => {
    const adjusted = [...counts];
    for (let i = 1; i < adjusted.length; i++) {
      const shift = s * adjusted[i];
      adjusted[i] -= shift;
      adjusted[i - 1] += shift;
    }
    return adjusted;
  };

  const adjustedRealistic = shiftCounts(sRealistic);
  const adjustedOptimistic = shiftCounts(sOptimistic);

  // Добавляем новые запросы
  const totalRealistic = adjustedRealistic.reduce((a, b) => a + b, 0);
  const totalOptimistic = adjustedOptimistic.reduce((a, b) => a + b, 0);

  const probRealistic = adjustedRealistic.map(c => c / totalRealistic);
  const probOptimistic = adjustedOptimistic.map(c => c / totalOptimistic);

  const newRealistic = probRealistic.map(p => Math.round(p * newQueries));
  const newOptimistic = probOptimistic.map(p => Math.round(p * newQueries));

  // Формируем финальную таблицу
  const finalSummary = summary.map((row, index) => ({
    position: row.position,
    count: row.count,
    ctr: row.ctr,
    ktraf: row.ktraf,
    realCount: Math.round(adjustedRealistic[index]) + newRealistic[index],
    optCount: Math.round(adjustedOptimistic[index]) + newOptimistic[index],
    ktrafReal: (Math.round(adjustedRealistic[index]) + newRealistic[index]) * (row.ctr / 100),
    ktrafOpt: (Math.round(adjustedOptimistic[index]) + newOptimistic[index]) * (row.ctr / 100)
  }));

  // Расчет роста трафика
  const currentTraffic = summary.reduce((sum, row) => sum + row.ktraf, 0);
  const realisticTraffic = finalSummary.reduce((sum, row) => sum + row.ktrafReal, 0);
  const optimisticTraffic = finalSummary.reduce((sum, row) => sum + row.ktrafOpt, 0);

  const realisticGrowth = ((realisticTraffic - currentTraffic) / currentTraffic) * 100;
  const optimisticGrowth = ((optimisticTraffic - currentTraffic) / currentTraffic) * 100;

  return {
    summary: finalSummary,
    currentMeanPosition,
    realisticMeanPosition,
    optimisticMeanPosition,
    currentTraffic,
    realisticTraffic,
    optimisticTraffic,
    realisticGrowth,
    optimisticGrowth
  };
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
