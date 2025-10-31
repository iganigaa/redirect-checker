import { NextRequest, NextResponse } from 'next/server';

interface QueryRow {
  position: number;
  ctr: number;
}

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

function parseCSV(csvText: string): QueryRow[] {
  const lines = csvText.trim().split('\n');
  const data: QueryRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length < 5) continue;
    
    // Позиция - 5-я колонка (индекс 4)
    // CTR - 4-я колонка (индекс 3)
    const position = parseFloat(parts[4]);
    let ctr = parts[3].trim();
    ctr = ctr.replace('%', '');
    const ctrValue = parseFloat(ctr);
    
    if (!isNaN(position) && !isNaN(ctrValue) && position >= 1 && position <= 10) {
      data.push({ position: Math.round(position), ctr: ctrValue });
    }
  }
  
  return data;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const csvFile = formData.get('csvFile') as File;
    const minGrowth = parseFloat(formData.get('minGrowth') as string) || 0;
    const maxGrowth = parseFloat(formData.get('maxGrowth') as string) || 0;
    const newQueries = parseInt(formData.get('newQueries') as string) || 0;

    if (!csvFile) {
      return NextResponse.json({ error: 'CSV файл обязателен' }, { status: 400 });
    }

    const csvText = await csvFile.text();
    const data = parseCSV(csvText);

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Не удалось распарсить данные. Проверьте формат CSV.' },
        { status: 400 }
      );
    }

    // Группировка по позициям
    const grouped = new Map<number, number[]>();
    for (let i = 1; i <= 10; i++) {
      grouped.set(i, []);
    }

    data.forEach(row => {
      const ctrs = grouped.get(row.position);
      if (ctrs) {
        ctrs.push(row.ctr);
      }
    });

    // Создаём сводную таблицу
    const summary: GroupedPosition[] = [];
    for (let i = 1; i <= 10; i++) {
      const ctrs = grouped.get(i) || [];
      if (ctrs.length > 0) {
        const count = ctrs.length;
        const medianCtr = calculateMedian(ctrs);
        const ktraf = count * (medianCtr / 100);
        
        summary.push({
          position: i,
          count,
          ctr: medianCtr,
          ktraf,
          realCount: 0,
          optCount: 0,
          ktrafReal: 0,
          ktrafOpt: 0
        });
      }
    }

    // Расчёт средней позиции
    const totalCounts = summary.reduce((sum, s) => sum + s.count, 0);
    const meanPosition = summary.reduce((sum, s) => sum + s.position * s.count, 0) / totalCounts;

    // Преобразуем проценты в новые средние позиции
    const meanRealistic = meanPosition * (1 - minGrowth / 100);
    const meanOptimistic = meanPosition * (1 - maxGrowth / 100);

    // Расчёт дельт
    const deltaReal = meanPosition - meanRealistic;
    const deltaOpt = meanPosition - meanOptimistic;

    // p1 - доля на первой позиции
    const p1 = summary[0] ? summary[0].count / totalCounts : 0;

    // Коэффициенты сдвига
    const calcS = (delta: number) => {
      if ((1 - p1) === 0) return 0;
      const s = delta / (1 - p1);
      return Math.min(Math.max(s, 0), 1);
    };

    const sRealistic = calcS(deltaReal);
    const sOptimistic = calcS(deltaOpt);

    // Функция сдвига запросов
    const shiftCounts = (s: number) => {
      const adjusted = summary.map(item => item.count);
      for (let i = 1; i < adjusted.length; i++) {
        const shift = s * adjusted[i];
        adjusted[i] -= shift;
        adjusted[i - 1] += shift;
      }
      return adjusted;
    };

    const adjustedReal = shiftCounts(sRealistic);
    const adjustedOpt = shiftCounts(sOptimistic);

    // Распределение новых запросов
    const totalReal = adjustedReal.reduce((sum, val) => sum + val, 0);
    const totalOpt = adjustedOpt.reduce((sum, val) => sum + val, 0);

    const probReal = adjustedReal.map(val => val / totalReal);
    const probOpt = adjustedOpt.map(val => val / totalOpt);

    const newReal = probReal.map(prob => Math.round(prob * newQueries));
    const newOpt = probOpt.map(prob => Math.round(prob * newQueries));

    // Финальные расчёты
    summary.forEach((item, index) => {
      item.realCount = Math.round(adjustedReal[index]) + newReal[index];
      item.optCount = Math.round(adjustedOpt[index]) + newOpt[index];
      item.ktrafReal = item.realCount * (item.ctr / 100);
      item.ktrafOpt = item.optCount * (item.ctr / 100);
    });

    // Итоги
    const currentTraffic = summary.reduce((sum, s) => sum + s.ktraf, 0);
    const realisticTraffic = summary.reduce((sum, s) => sum + s.ktrafReal, 0);
    const optimisticTraffic = summary.reduce((sum, s) => sum + s.ktrafOpt, 0);

    const realisticGrowth = realisticTraffic - currentTraffic;
    const optimisticGrowth = optimisticTraffic - currentTraffic;
    const realisticGrowthPercent = (realisticGrowth / currentTraffic) * 100;
    const optimisticGrowthPercent = (optimisticGrowth / currentTraffic) * 100;

    const result: CalculationResult = {
      results: summary,
      summary: {
        currentTraffic: Math.round(currentTraffic * 100) / 100,
        realisticTraffic: Math.round(realisticTraffic * 100) / 100,
        optimisticTraffic: Math.round(optimisticTraffic * 100) / 100,
        realisticGrowth: Math.round(realisticGrowth * 100) / 100,
        optimisticGrowth: Math.round(optimisticGrowth * 100) / 100,
        realisticGrowthPercent: Math.round(realisticGrowthPercent * 100) / 100,
        optimisticGrowthPercent: Math.round(optimisticGrowthPercent * 100) / 100
      }
    };

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Ошибка при расчете:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
