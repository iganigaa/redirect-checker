import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface CheckResult {
  category: string;
  check: string;
  status: '✅' | '⚠️' | '❌' | 'ℹ️';
  message: string;
  recommendation?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url, robotsText } = await request.json();
    
    let text = robotsText;
    let fetchedUrl = url;
    let statusCode = 200;

    // Если не передан текст вручную - загружаем с сайта
    if (!text && url) {
      try {
        const robotsUrl = new URL('/robots.txt', url).href;
        fetchedUrl = robotsUrl;
        
        const response = await axios.get(robotsUrl, {
          timeout: 10000,
          validateStatus: () => true,
          maxRedirects: 5
        });
        
        statusCode = response.status;
        text = response.data;
      } catch (error: any) {
        return NextResponse.json({ 
          error: 'Не удалось загрузить robots.txt с указанного URL' 
        }, { status: 400 });
      }
    }

    if (!text) {
      return NextResponse.json({ error: 'Необходим URL или текст robots.txt' }, { status: 400 });
    }

    const analysis = analyzeRobotsTxt(text, statusCode, fetchedUrl);
    
    return NextResponse.json(analysis);
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Ошибка при анализе robots.txt' 
    }, { status: 500 });
  }
}

function analyzeRobotsTxt(text: string, statusCode: number, url: string) {
  const checks: CheckResult[] = [];
  const lines = text.split('\n');
  
  // Извлекаем информацию
  const userAgents = extractUserAgents(lines);
  const sitemaps = extractSitemaps(lines);
  const hasHost = /^Host:/im.test(text);
  const hasCleanParam = /^Clean-param:/im.test(text);
  
  // 1. ТЕХНИЧЕСКИЕ ПРОВЕРКИ
  
  // Наличие файла
  if (statusCode === 200) {
    checks.push({
      category: 'Технические проверки',
      check: 'Наличие файла',
      status: '✅',
      message: 'Файл robots.txt найден и доступен'
    });
  } else if (statusCode === 404) {
    checks.push({
      category: 'Технические проверки',
      check: 'Наличие файла',
      status: '❌',
      message: 'Файл robots.txt не найден (404)',
      recommendation: 'Создайте файл robots.txt в корне сайта'
    });
  } else {
    checks.push({
      category: 'Технические проверки',
      check: 'Наличие файла',
      status: '⚠️',
      message: `Неожиданный код ответа: ${statusCode}`,
      recommendation: 'Файл должен отдавать код 200'
    });
  }
  
  // Размер файла
  const sizeKB = new Blob([text]).size / 1024;
  if (sizeKB > 500) {
    checks.push({
      category: 'Технические проверки',
      check: 'Размер файла',
      status: '⚠️',
      message: `Размер файла ${sizeKB.toFixed(1)} КБ превышает рекомендуемый лимит 500 КБ`,
      recommendation: 'Поисковики могут игнорировать часть правил. Сократите файл.'
    });
  } else {
    checks.push({
      category: 'Технические проверки',
      check: 'Размер файла',
      status: '✅',
      message: `Размер файла: ${sizeKB.toFixed(1)} КБ`
    });
  }
  
  // Кодировка (упрощенная проверка)
  const hasBOM = text.charCodeAt(0) === 0xFEFF;
  if (hasBOM) {
    checks.push({
      category: 'Технические проверки',
      check: 'Кодировка файла',
      status: '⚠️',
      message: 'Обнаружен BOM (Byte Order Mark)',
      recommendation: 'Используйте UTF-8 без BOM'
    });
  } else {
    checks.push({
      category: 'Технические проверки',
      check: 'Кодировка файла',
      status: '✅',
      message: 'Кодировка корректна (UTF-8 без BOM)'
    });
  }
  
  // 2. СИНТАКСИС И ВАЛИДНОСТЬ
  
  // User-agent
  if (userAgents.length === 0) {
    checks.push({
      category: 'Синтаксис и валидность',
      check: 'Директива User-agent',
      status: '❌',
      message: 'Не найдено ни одной директивы User-agent',
      recommendation: 'Добавьте хотя бы "User-agent: *"'
    });
  } else {
    checks.push({
      category: 'Синтаксис и валидность',
      check: 'Директива User-agent',
      status: '✅',
      message: `Найдено User-agent директив: ${userAgents.length}`
    });
  }
  
  // Проверка синтаксиса путей
  const invalidPaths = lines.filter(line => {
    const match = line.match(/^(Disallow|Allow):\s*(.+)/i);
    if (match) {
      const path = match[2].trim();
      return path && !path.startsWith('/') && !path.startsWith('*');
    }
    return false;
  });
  
  if (invalidPaths.length > 0) {
    checks.push({
      category: 'Синтаксис и валидность',
      check: 'Корректность путей',
      status: '❌',
      message: `Найдены некорректные пути (${invalidPaths.length} шт.)`,
      recommendation: 'Пути должны начинаться с / или *'
    });
  } else {
    checks.push({
      category: 'Синтаксис и валидность',
      check: 'Корректность путей',
      status: '✅',
      message: 'Все пути корректны'
    });
  }
  
  // Пустые строки в блоках
  let hasEmptyLinesInBlock = false;
  let inBlock = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('User-agent:')) {
      inBlock = true;
    } else if (trimmed === '' && inBlock) {
      hasEmptyLinesInBlock = true;
      inBlock = false;
    } else if (trimmed !== '' && !trimmed.startsWith('#')) {
      inBlock = true;
    }
  }
  
  if (hasEmptyLinesInBlock) {
    checks.push({
      category: 'Синтаксис и валидность',
      check: 'Пустые строки',
      status: '⚠️',
      message: 'Обнаружены пустые строки внутри блоков директив',
      recommendation: 'Удалите пустые строки между директивами одного блока'
    });
  }
  
  // 3. СЕМАНТИЧЕСКИЕ ПРОВЕРКИ
  
  // Host (для Яндекса)
  if (!hasHost) {
    checks.push({
      category: 'Семантические проверки',
      check: 'Директива Host',
      status: '⚠️',
      message: 'Директива Host отсутствует',
      recommendation: 'Добавьте "Host: yourdomain.ru" для корректной работы с Яндексом'
    });
  } else {
    const hostMatches = text.match(/^Host:\s*(.+)/img);
    if (hostMatches && hostMatches.length > 1) {
      checks.push({
        category: 'Семантические проверки',
        check: 'Директива Host',
        status: '❌',
        message: 'Найдено несколько директив Host',
        recommendation: 'Яндекс поддерживает только одну директиву Host'
      });
    } else {
      checks.push({
        category: 'Семантические проверки',
        check: 'Директива Host',
        status: '✅',
        message: 'Директива Host указана корректно'
      });
    }
  }
  
  // Sitemap
  if (sitemaps.length === 0) {
    checks.push({
      category: 'Семантические проверки',
      check: 'Директива Sitemap',
      status: '⚠️',
      message: 'Не указана карта сайта',
      recommendation: 'Добавьте "Sitemap: https://yourdomain.ru/sitemap.xml"'
    });
  } else {
    checks.push({
      category: 'Семантические проверки',
      check: 'Директива Sitemap',
      status: '✅',
      message: `Найдено карт сайта: ${sitemaps.length}`
    });
  }
  
  // Clean-param
  checks.push({
    category: 'Семантические проверки',
    check: 'Директива Clean-param',
    status: hasCleanParam ? '✅' : 'ℹ️',
    message: hasCleanParam ? 'Директива Clean-param найдена' : 'Директива Clean-param отсутствует',
    recommendation: hasCleanParam ? undefined : 'Рекомендуется добавить для снижения дублей (только для Яндекса)'
  });
  
  // Конфликты Allow/Disallow
  const disallowAll = /^Disallow:\s*\/\s*$/im.test(text);
  const hasAllow = /^Allow:/im.test(text);
  
  if (disallowAll && hasAllow) {
    checks.push({
      category: 'Семантические проверки',
      check: 'Конфликты директив',
      status: '⚠️',
      message: 'Найден "Disallow: /" вместе с директивами Allow',
      recommendation: 'Убедитесь что Allow директивы имеют приоритет'
    });
  } else {
    checks.push({
      category: 'Семантические проверки',
      check: 'Конфликты директив',
      status: '✅',
      message: 'Явных конфликтов не обнаружено'
    });
  }
  
  // 4. ДОСТУП К РЕСУРСАМ
  
  // CSS/JS
  const blocksCssJs = /^Disallow:.*\.(css|js)$/im.test(text);
  if (blocksCssJs) {
    checks.push({
      category: 'Доступ к ресурсам',
      check: 'CSS и JavaScript',
      status: '❌',
      message: 'Обнаружен запрет на индексацию CSS или JS файлов',
      recommendation: 'Google не сможет правильно отрендерить страницы. Разрешите доступ к CSS/JS'
    });
  } else {
    checks.push({
      category: 'Доступ к ресурсам',
      check: 'CSS и JavaScript',
      status: '✅',
      message: 'CSS и JavaScript доступны для индексации'
    });
  }
  
  // Изображения
  const blocksImages = /^Disallow:.*\.(jpg|jpeg|png|gif|webp|svg)$/im.test(text);
  if (blocksImages) {
    checks.push({
      category: 'Доступ к ресурсам',
      check: 'Изображения',
      status: '⚠️',
      message: 'Обнаружен запрет на индексацию изображений',
      recommendation: 'Изображения не будут индексироваться в Google Images'
    });
  } else {
    checks.push({
      category: 'Доступ к ресурсам',
      check: 'Изображения',
      status: '✅',
      message: 'Изображения доступны для индексации'
    });
  }
  
  // Подсчет статистики
  const summary = {
    total: checks.length,
    passed: checks.filter(c => c.status === '✅').length,
    warnings: checks.filter(c => c.status === '⚠️').length,
    errors: checks.filter(c => c.status === '❌').length
  };
  
  return {
    url,
    robotsText: text,
    checks,
    summary,
    userAgents,
    sitemaps,
    hasHost,
    hasCleanParam
  };
}

function extractUserAgents(lines: string[]): string[] {
  const agents = new Set<string>();
  lines.forEach(line => {
    const match = line.match(/^User-agent:\s*(.+)/i);
    if (match) {
      agents.add(match[1].trim());
    }
  });
  return Array.from(agents);
}

function extractSitemaps(lines: string[]): string[] {
  const maps: string[] = [];
  lines.forEach(line => {
    const match = line.match(/^Sitemap:\s*(.+)/i);
    if (match) {
      maps.push(match[1].trim());
    }
  });
  return maps;
}
