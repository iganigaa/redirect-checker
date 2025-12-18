import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface RedirectStep {
  url: string;
  statusCode: number;
}

interface CheckResult {
  number: number;
  checkName: string;
  url: string;
  expected: string;
  statusCode: number | null;
  redirectChain: string[];
  redirectSteps: RedirectStep[]; // Детальная цепочка с кодами
  fact: string; // Технический результат
  recommendation: string; // Рекомендация для специалиста
  status: '✅' | '❌' | '⚠️';
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url, userAgent } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL обязателен' }, { status: 400 });
    }

    const results = await checkWebsite(url, userAgent || 'Googlebot Smartphone');
    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Ошибка при проверке сайта' }, { status: 500 });
  }
}

async function checkWebsite(baseUrl: string, userAgent: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const parsed = new URL(baseUrl);
  
  // Проверяем что основной URL доступен
  const mainCheck = await checkUrlFull(baseUrl, userAgent);
  if (mainCheck.finalStatus !== 200) {
    return [{
      number: 0,
      checkName: 'Основной URL',
      url: baseUrl,
      expected: 'Код 200',
      statusCode: mainCheck.finalStatus,
      redirectChain: mainCheck.chain,
      redirectSteps: mainCheck.redirectSteps || [],
      fact: generateFact(mainCheck),
      recommendation: 'Проверить доступность основного URL сайта. Убедиться, что сайт работает и возвращает код 200.',
      status: '❌',
      message: 'Основной адрес сайта недоступен'
    }];
  }

  // 1. Проверка HTTPS
  const httpUrl = baseUrl.replace('https://', 'http://');
  if (httpUrl !== baseUrl) {
    const check = await checkUrlFull(httpUrl, userAgent);
    results.push({
      number: 1,
      checkName: 'HTTPS',
      url: httpUrl,
      expected: `301 → ${baseUrl}`,
      statusCode: check.firstStatus,
      redirectChain: check.chain,
      redirectSteps: check.redirectSteps || [],
      fact: generateFact(check),
      recommendation: generateRecommendation(check, 'HTTPS', `301 → ${baseUrl}`, baseUrl),
      status: analyzeHttpsRedirect(check, baseUrl),
      message: getHttpsMessage(check, baseUrl)
    });
  }

  // 2. Проверка WWW
  let wwwUrl: string;
  if (parsed.hostname.startsWith('www.')) {
    wwwUrl = baseUrl.replace('://www.', '://');
  } else {
    wwwUrl = baseUrl.replace('://', '://www.');
  }
  
  const wwwCheck = await checkUrlFull(wwwUrl, userAgent);
  results.push({
    number: 2,
    checkName: 'WWW',
    url: wwwUrl,
    expected: `301 → ${baseUrl}`,
    statusCode: wwwCheck.firstStatus,
    redirectChain: wwwCheck.chain,
    redirectSteps: wwwCheck.redirectSteps || [],
    fact: generateFact(wwwCheck),
    recommendation: generateRecommendation(wwwCheck, 'WWW', `301 → ${baseUrl}`, baseUrl),
    status: analyzeWwwRedirect(wwwCheck, baseUrl),
    message: getWwwMessage(wwwCheck, baseUrl)
  });

  // Парсим внутренние ссылки для дальнейших проверок
  const internalLinks = await parseInternalLinks(baseUrl, mainCheck.html);
  const testLink = internalLinks[0] || baseUrl + 'catalog/';

  // 3. Множественные слеши
  const multiSlashUrl = testLink.replace(/\/$/, '') + '///';
  const multiSlashCheck = await checkUrlFull(multiSlashUrl, userAgent);
  results.push({
    number: 3,
    checkName: 'Множественные слеши',
    url: multiSlashUrl,
    expected: `301 → ${testLink}`,
    statusCode: multiSlashCheck.firstStatus,
    redirectChain: multiSlashCheck.chain,
    redirectSteps: multiSlashCheck.redirectSteps || [],
    fact: generateFact(multiSlashCheck),
    recommendation: generateRecommendation(multiSlashCheck, 'Множественные слеши', `301 → ${testLink}`, testLink),
    status: analyzeMultiSlash(multiSlashCheck, testLink),
    message: getMultiSlashMessage(multiSlashCheck, testLink)
  });

  // 4. Разный регистр
  const upperUrl = testLink.replace(/\/[^\/]+\/$/, (match) => match.toUpperCase());
  if (upperUrl !== testLink) {
    const caseCheck = await checkUrlFull(upperUrl, userAgent);
    results.push({
      number: 4,
      checkName: 'Разный регистр',
      url: upperUrl,
      expected: `301 → ${testLink}`,
      statusCode: caseCheck.firstStatus,
      redirectChain: caseCheck.chain,
      redirectSteps: caseCheck.redirectSteps || [],
      fact: generateFact(caseCheck),
      recommendation: generateRecommendation(caseCheck, 'Разный регистр', `301 → ${testLink}`, testLink),
      status: analyzeCaseRedirect(caseCheck, testLink),
      message: getCaseMessage(caseCheck, testLink)
    });
  }

  // 5. Index-файлы
  const indexUrls = [
    baseUrl + 'index.html',
    baseUrl + 'index.php',
    baseUrl + 'index.htm'
  ];
  
  for (const indexUrl of indexUrls) {
    const indexCheck = await checkUrlFull(indexUrl, userAgent);
    results.push({
      number: 5,
      checkName: 'Index-файлы',
      url: indexUrl,
      expected: `301 → ${baseUrl}`,
      statusCode: indexCheck.firstStatus,
      redirectChain: indexCheck.chain,
      redirectSteps: indexCheck.redirectSteps || [],
      fact: generateFact(indexCheck),
      recommendation: generateRecommendation(indexCheck, 'Index-файлы', `301 → ${baseUrl}`, baseUrl),
      status: analyzeIndexRedirect(indexCheck, baseUrl),
      message: getIndexMessage(indexCheck, baseUrl)
    });
  }

  // 6. Консистентность слешей
  const noSlashUrl = testLink.replace(/\/$/, '');
  const slashCheck = await checkUrlFull(noSlashUrl, userAgent);
  results.push({
    number: 6,
    checkName: 'Консистентность слешей',
    url: noSlashUrl,
    expected: `301 → ${testLink} (или наоборот)`,
    statusCode: slashCheck.firstStatus,
    redirectChain: slashCheck.chain,
    redirectSteps: slashCheck.redirectSteps || [],
    fact: generateFact(slashCheck),
    recommendation: generateRecommendation(slashCheck, 'Консистентность слешей', `301 → ${testLink} (или наоборот)`, testLink),
    status: analyzeSlashConsistency(slashCheck, testLink),
    message: getSlashMessage(slashCheck, testLink)
  });

  // 7. Старые расширения
  const htmlUrl = testLink.replace(/\/$/, '') + '.html';
  const htmlCheck = await checkUrlFull(htmlUrl, userAgent);
  results.push({
    number: 7,
    checkName: 'Старые расширения',
    url: htmlUrl,
    expected: `301 → ${testLink} или 404`,
    statusCode: htmlCheck.firstStatus,
    redirectChain: htmlCheck.chain,
    redirectSteps: htmlCheck.redirectSteps || [],
    fact: generateFact(htmlCheck),
    recommendation: generateRecommendation(htmlCheck, 'Старые расширения', `301 → ${testLink} или 404`, testLink),
    status: analyzeOldExtension(htmlCheck, testLink),
    message: getOldExtensionMessage(htmlCheck, testLink)
  });

  // 8. Наличие canonical
  const utmUrl = testLink + '?utm_source=test';
  const canonicalCheck = await checkUrlFull(utmUrl, userAgent);
  const hasCanonical = checkCanonical(canonicalCheck.html, testLink);
  results.push({
    number: 8,
    checkName: 'Наличие canonical',
    url: utmUrl,
    expected: `<link rel="canonical" href="${testLink}">`,
    statusCode: canonicalCheck.finalStatus,
    redirectChain: canonicalCheck.chain,
    redirectSteps: canonicalCheck.redirectSteps || [],
    fact: `${canonicalCheck.finalStatus} → ${hasCanonical ? 'Canonical найден' : 'Canonical отсутствует'}`,
    recommendation: hasCanonical 
      ? 'Всё настроено корректно. Canonical тег найден и указывает на правильную страницу.'
      : 'Добавить тег <link rel="canonical" href="..."> в <head> страницы для URL с UTM-метками и другими параметрами.',
    status: hasCanonical ? '✅' : '❌',
    message: hasCanonical ? 'Canonical найден' : 'Canonical отсутствует'
  });

  // 9. Код 404
  const notFoundUrl = baseUrl + 'nonexistentpage12345/';
  const notFoundCheck = await checkUrlFull(notFoundUrl, userAgent);
  results.push({
    number: 9,
    checkName: 'Код 404',
    url: notFoundUrl,
    expected: 'Код 404',
    statusCode: notFoundCheck.finalStatus,
    redirectChain: notFoundCheck.chain,
    redirectSteps: notFoundCheck.redirectSteps || [],
    fact: generateFact(notFoundCheck),
    recommendation: generateRecommendation(notFoundCheck, 'Код 404', 'Код 404'),
    status: analyze404(notFoundCheck),
    message: get404Message(notFoundCheck)
  });

  // 11. Лишние редиректы (цепочка)
  const httpWwwUrl = baseUrl.replace('https://', 'http://').replace('://', '://www.');
  const chainCheck = await checkUrlFull(httpWwwUrl, userAgent);
  results.push({
    number: 11,
    checkName: 'Лишние редиректы',
    url: httpWwwUrl,
    expected: '≤1 редиректа',
    statusCode: chainCheck.firstStatus,
    redirectChain: chainCheck.chain,
    redirectSteps: chainCheck.redirectSteps || [],
    fact: generateFact(chainCheck),
    recommendation: generateRecommendation(chainCheck, 'Лишние редиректы', '≤1 редиректа'),
    status: chainCheck.redirectCount <= 1 ? '✅' : '❌',
    message: chainCheck.redirectCount <= 1 ? 'Оптимальная цепочка' : `Цепочка из ${chainCheck.redirectCount} редиректов`
  });

  return results;
}

async function checkUrlFull(url: string, userAgent: string) {
  const chain: string[] = [url];
  const redirectSteps: RedirectStep[] = [];
  let currentUrl = url;
  let firstStatus: number | null = null;
  let finalStatus: number | null = null;
  let redirectCount = 0;
  let html = '';

  try {
    for (let i = 0; i < 10; i++) {
      const response = await axios.get(currentUrl, {
        headers: { 'User-Agent': userAgent },
        maxRedirects: 0,
        validateStatus: () => true,
        timeout: 10000,
      });

      if (firstStatus === null) {
        firstStatus = response.status;
      }
      finalStatus = response.status;

      // Сохраняем каждый шаг с кодом ответа
      redirectSteps.push({
        url: currentUrl,
        statusCode: response.status
      });

      if (response.status >= 300 && response.status < 400 && response.headers.location) {
        redirectCount++;
        currentUrl = new URL(response.headers.location, currentUrl).href;
        chain.push(currentUrl);
      } else {
        html = response.data || '';
        break;
      }
    }
  } catch (error: any) {
    if (error.response) {
      finalStatus = error.response.status;
      firstStatus = firstStatus || error.response.status;
      redirectSteps.push({
        url: currentUrl,
        statusCode: error.response.status
      });
    }
  }

  return {
    firstStatus,
    finalStatus,
    chain,
    redirectSteps,
    redirectCount,
    html,
    finalUrl: chain[chain.length - 1]
  };
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return (parsed.protocol + '//' + parsed.hostname + parsed.pathname).toLowerCase().replace(/\/+$/, '/');
  } catch {
    return url.toLowerCase();
  }
}

// Генерация технического факта (цепочка редиректов с кодами)
function generateFact(check: any): string {
  if (!check.redirectSteps || check.redirectSteps.length === 0) {
    return `${check.finalStatus || '—'} → ${check.finalUrl || '—'}`;
  }
  
  // Разделяем редиректы (300-399) и финальный ответ
  const redirects = check.redirectSteps.filter((step: RedirectStep) => 
    step.statusCode >= 300 && step.statusCode < 400
  );
  
  const finalStep = check.redirectSteps[check.redirectSteps.length - 1];
  
  // Если нет редиректов, показываем только финальный статус
  if (redirects.length === 0) {
    return `${finalStep.statusCode} → ${finalStep.url}`;
  }
  
  // Показываем редиректы + финальный статус отдельно
  const redirectCodes = redirects.map((step: RedirectStep) => step.statusCode).join(' → ');
  return `${redirectCodes} → ${finalStep.statusCode} → ${finalStep.url}`;
}

// Генерация рекомендаций для специалиста
function generateRecommendation(check: any, checkName: string, expected: string, targetUrl?: string): string {
  const fact = generateFact(check);
  
  // Если всё ок
  if (check.finalStatus === 200 && check.redirectCount === 0 && !expected.includes('301')) {
    return 'Никаких действий не требуется. Всё настроено корректно.';
  }
  
  // Проверка HTTPS
  if (checkName === 'HTTPS') {
    if (check.firstStatus !== 301 && check.firstStatus !== 308) {
      return 'Настроить редирект с HTTP на HTTPS (301 или 308) в настройках веб-сервера или через .htaccess.';
    }
    if (check.redirectCount > 1) {
      return `Обнаружена цепочка из ${check.redirectCount} редиректов. Упростить до одного прямого редиректа HTTP → HTTPS.`;
    }
    if (check.finalStatus === 404) {
      return 'Редирект ведет на несуществующую страницу (404). Настроить корректный редирект.';
    }
    if (check.finalStatus !== 200) {
      return `Редирект настроен некорректно. Конечный статус: ${check.finalStatus}. Исправить редирект.`;
    }
    if (normalizeUrl(check.finalUrl) !== normalizeUrl(targetUrl || '')) {
      return `Исправить целевой URL редиректа. Ожидается: ${targetUrl}, фактически: ${check.finalUrl}`;
    }
    return 'Прямой редирект настроен корректно.';
  }
  
  // Проверка WWW
  if (checkName === 'WWW') {
    if (check.firstStatus === 200) {
      return 'Настроить редирект между версиями с www и без www (301 или 308). Выберите одну каноническую версию.';
    }
    if (check.redirectCount > 1) {
      return `Обнаружена цепочка из ${check.redirectCount} редиректов. Упростить до одного прямого редиректа между www и без www.`;
    }
    if (check.finalStatus === 404) {
      return 'Редирект ведет на несуществующую страницу (404). Настроить корректный редирект.';
    }
    if (check.finalStatus !== 200) {
      return `Редирект настроен некорректно. Конечный статус: ${check.finalStatus}. Исправить редирект.`;
    }
    if (normalizeUrl(check.finalUrl) !== normalizeUrl(targetUrl || '')) {
      return `Исправить целевой URL редиректа. Ожидается: ${targetUrl}, фактически: ${check.finalUrl}`;
    }
    return 'Прямой редирект настроен корректно.';
  }
  
  // Множественные слеши
  if (checkName === 'Множественные слеши') {
    if (check.firstStatus === 200) {
      return 'Настроить редирект множественных слешей (///) на один слеш (301 или 308).';
    }
    if (check.redirectCount > 1) {
      return `Обнаружена цепочка из ${check.redirectCount} редиректов. Упростить до одного прямого редиректа.`;
    }
    if (check.finalStatus === 404) {
      return 'Редирект ведет на несуществующую страницу (404). Настроить корректный редирект.';
    }
    if (check.finalStatus !== 200) {
      return `Редирект настроен некорректно. Конечный статус: ${check.finalStatus}. Исправить редирект.`;
    }
    if (normalizeUrl(check.finalUrl) !== normalizeUrl(targetUrl || '')) {
      return `Исправить целевой URL редиректа. Ожидается: ${targetUrl}`;
    }
    return 'Прямой редирект настроен корректно.';
  }
  
  // Разный регистр
  if (checkName === 'Разный регистр') {
    if (check.firstStatus === 200) {
      return 'Настроить редирект URL с разным регистром на каноническую версию (301 или 308).';
    }
    if (check.redirectCount > 1) {
      return `Обнаружена цепочка из ${check.redirectCount} редиректов. Упростить до одного прямого редиректа.`;
    }
    if (check.finalStatus === 404) {
      return 'Редирект ведет на несуществующую страницу (404). Настроить корректный редирект на существующую страницу.';
    }
    if (check.finalStatus !== 200) {
      return `Редирект настроен некорректно. Конечный статус: ${check.finalStatus}. Исправить редирект.`;
    }
    if (targetUrl && normalizeUrl(check.finalUrl) !== normalizeUrl(targetUrl)) {
      return `Редирект ведет на неправильный URL. Ожидается: ${targetUrl}, фактически: ${check.finalUrl}`;
    }
    return 'Прямой редирект настроен корректно.';
  }
  
  // Index-файлы
  if (checkName === 'Index-файлы') {
    if (check.firstStatus === 200) {
      return 'Настроить редирект index.html/index.php на главную страницу без index (301 или 308).';
    }
    if (check.firstStatus === 404) {
      return 'Всё настроено корректно. Index-файлы недоступны (404).';
    }
    if (check.firstStatus === 403 || check.finalStatus === 403) {
      return 'Редирект настроен некорректно. Конечный статус: 403. Исправить редирект.';
    }
    if (check.redirectCount > 1) {
      return `Обнаружена цепочка из ${check.redirectCount} редиректов. Упростить до одного прямого редиректа.`;
    }
    if (check.finalStatus === 404) {
      return 'Редирект ведет на несуществующую страницу (404). Настроить корректный редирект на главную страницу.';
    }
    if (check.finalStatus !== 200) {
      return `Редирект настроен некорректно. Конечный статус: ${check.finalStatus}. Исправить редирект.`;
    }
    if (targetUrl && normalizeUrl(check.finalUrl) !== normalizeUrl(targetUrl)) {
      return `Редирект ведет на неправильный URL. Ожидается: ${targetUrl}, фактически: ${check.finalUrl}`;
    }
    return 'Прямой редирект настроен корректно.';
  }
  
  // Консистентность слешей
  if (checkName === 'Консистентность слешей') {
    if (check.firstStatus === 200) {
      return 'Выбрать единый формат URL (со слешем или без) и настроить редирект на каноническую версию (301 или 308).';
    }
    if (check.redirectCount > 1) {
      return `Обнаружена цепочка из ${check.redirectCount} редиректов. Упростить до одного прямого редиректа.`;
    }
    if (check.finalStatus === 404) {
      return 'Редирект ведет на несуществующую страницу (404). Настроить корректный редирект.';
    }
    if (check.finalStatus !== 200) {
      return `Редирект настроен некорректно. Конечный статус: ${check.finalStatus}. Исправить редирект.`;
    }
    return 'Прямой редирект настроен корректно.';
  }
  
  // Старые расширения
  if (checkName === 'Старые расширения') {
    if (check.firstStatus === 404) {
      return 'Всё настроено корректно. Старые расширения недоступны (404).';
    }
    if (check.firstStatus !== 301 && check.firstStatus !== 308) {
      return 'Настроить редирект старых расширений (.html) на версию без расширения (301 или 308) или вернуть 404.';
    }
    if (check.redirectCount > 1) {
      return `Обнаружена цепочка из ${check.redirectCount} редиректов. Упростить до одного прямого редиректа.`;
    }
    if (check.finalStatus === 404) {
      return 'Редирект ведет на несуществующую страницу (404). Настроить корректный редирект или вернуть сразу 404.';
    }
    if (check.finalStatus !== 200) {
      return `Редирект настроен некорректно. Конечный статус: ${check.finalStatus}. Исправить редирект.`;
    }
    if (targetUrl && normalizeUrl(check.finalUrl) !== normalizeUrl(targetUrl)) {
      return `Редирект ведет на неправильный URL. Ожидается: ${targetUrl}, фактически: ${check.finalUrl}`;
    }
    return 'Прямой редирект настроен корректно.';
  }
  
  // Наличие canonical
  if (checkName === 'Наличие canonical') {
    return 'Добавить тег <link rel="canonical" href="..."> в <head> страницы для URL с UTM-метками и другими параметрами.';
  }
  
  // Код 404
  if (checkName === 'Код 404') {
    if (check.finalStatus === 200) {
      return 'Исправить обработку несуществующих страниц. Должен возвращаться код 404, а не 200 (soft 404).';
    }
    if (check.firstStatus === 301 || check.firstStatus === 302) {
      return 'Исправить обработку несуществующих страниц. Не должно быть редиректа на 404 странице.';
    }
    if (check.redirectCount > 0) {
      return `Обнаружена цепочка редиректов на несуществующей странице. Должен сразу возвращаться 404 без редиректов.`;
    }
    return 'Всё настроено корректно.';
  }
  
  // Лишние редиректы
  if (checkName === 'Лишние редиректы') {
    if (check.redirectCount > 1) {
      return `Обнаружена цепочка из ${check.redirectCount} редиректов. Упростить до одного прямого редиректа. Объединить все редиректы в один.`;
    }
    return 'Оптимальная цепочка редиректов (не более 1).';
  }
  
  // Общая рекомендация
  if (check.finalStatus && check.finalStatus >= 400) {
    return `Исправить обработку URL. Текущий код ответа: ${check.finalStatus}`;
  }
  
  return 'Проверить настройки редиректов и убедиться, что они соответствуют ожидаемому результату.';
}

function analyzeHttpsRedirect(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '❌';
  if (check.redirectCount > 1) return '❌'; // Цепочка редиректов - ошибка
  if (check.finalStatus === 404) return '❌'; // Редирект на 404 - ошибка
  if (check.finalStatus !== 200) return '❌'; // Некорректный конечный статус
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return '✅';
  return '⚠️';
}

function getHttpsMessage(check: any, targetUrl: string): string {
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return 'Нет редиректа';
  if (check.redirectCount > 1) return `Цепочка редиректов (${check.redirectCount})`;
  if (check.finalStatus === 404) return 'Редирект на 404';
  if (check.finalStatus !== 200) return `Ошибка: статус ${check.finalStatus}`;
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return 'Прямой редирект';
  return 'Редирект на неправильный URL';
}

function analyzeWwwRedirect(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus === 200) return '❌';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '❌';
  if (check.redirectCount > 1) return '❌'; // Цепочка редиректов - ошибка
  if (check.finalStatus === 404) return '❌'; // Редирект на 404 - ошибка
  if (check.finalStatus !== 200) return '❌'; // Некорректный конечный статус
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return '✅';
  return '⚠️';
}

function getWwwMessage(check: any, targetUrl: string): string {
  if (check.firstStatus === 200) return 'Нет редиректа';
  if (check.redirectCount > 1) return `Цепочка редиректов (${check.redirectCount})`;
  if (check.finalStatus === 404) return 'Редирект на 404';
  if (check.finalStatus !== 200) return `Ошибка: статус ${check.finalStatus}`;
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return 'Прямой редирект';
  return 'Редирект на неправильный URL';
}

function analyzeMultiSlash(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus === 200) return '⚠️';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '❌';
  if (check.redirectCount > 1) return '❌'; // Цепочка редиректов - ошибка
  if (check.finalStatus === 404) return '❌'; // Редирект на 404 - ошибка
  if (check.finalStatus !== 200) return '❌'; // Некорректный конечный статус
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return '✅';
  return '❌';
}

function getMultiSlashMessage(check: any, targetUrl: string): string {
  if (check.firstStatus === 200) return 'Отдаёт 200';
  if (check.redirectCount > 1) return `Цепочка редиректов (${check.redirectCount})`;
  if (check.finalStatus === 404) return 'Редирект на 404';
  if (check.finalStatus !== 200) return `Ошибка: статус ${check.finalStatus}`;
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return 'Прямой редирект';
  return 'Ошибка редиректа';
}

function analyzeCaseRedirect(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus === 200) return '⚠️';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '❌';
  if (check.redirectCount > 1) return '❌'; // Цепочка редиректов - ошибка
  if (check.finalStatus === 404) return '❌'; // Редирект на 404 - ошибка
  if (check.finalStatus !== 200) return '❌'; // Некорректный конечный статус
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return '✅';
  return '❌';
}

function getCaseMessage(check: any, targetUrl: string): string {
  if (check.firstStatus === 200) return 'Дубли по регистру';
  if (check.redirectCount > 1) return `Цепочка редиректов (${check.redirectCount})`;
  if (check.finalStatus === 404) return 'Редирект на 404';
  if (check.finalStatus !== 200) return `Ошибка: статус ${check.finalStatus}`;
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return 'Прямой редирект';
  return 'Нет редиректа';
}

function analyzeIndexRedirect(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus === 200) return '⚠️';
  if (check.firstStatus === 404) return '✅';
  if (check.firstStatus === 403) return '❌'; // 403 - ошибка
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '❌';
  if (check.redirectCount > 1) return '❌'; // Цепочка редиректов - ошибка
  if (check.finalStatus === 404) return '❌'; // Редирект на 404 - ошибка
  if (check.finalStatus === 403) return '❌'; // Редирект на 403 - ошибка
  if (check.finalStatus !== 200) return '❌'; // Некорректный конечный статус
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return '✅';
  return '❌';
}

function getIndexMessage(check: any, targetUrl: string): string {
  if (check.firstStatus === 200) return '200 на index-файл';
  if (check.firstStatus === 404) return 'Всё ок (404)';
  if (check.firstStatus === 403) return 'Ошибка: статус 403';
  if (check.redirectCount > 1) return `Цепочка редиректов (${check.redirectCount})`;
  if (check.finalStatus === 404) return 'Редирект на 404';
  if (check.finalStatus === 403) return 'Редирект на 403';
  if (check.finalStatus !== 200) return `Ошибка: статус ${check.finalStatus}`;
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return 'Прямой редирект';
  return 'Нет редиректа';
}

function analyzeSlashConsistency(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus === 200) return '⚠️';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '❌';
  if (check.redirectCount > 1) return '❌'; // Цепочка редиректов - ошибка
  if (check.finalStatus === 404) return '❌'; // Редирект на 404 - ошибка
  if (check.finalStatus !== 200) return '❌'; // Некорректный конечный статус
  return '✅';
}

function getSlashMessage(check: any, targetUrl: string): string {
  if (check.firstStatus === 200) return 'Несоответствие паттерна';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return 'Нет редиректа';
  if (check.redirectCount > 1) return `Цепочка редиректов (${check.redirectCount})`;
  if (check.finalStatus === 404) return 'Редирект на 404';
  if (check.finalStatus !== 200) return `Ошибка: статус ${check.finalStatus}`;
  return 'Прямой редирект';
}

function analyzeOldExtension(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus === 404) return '✅';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '⚠️';
  if (check.redirectCount > 1) return '❌'; // Цепочка редиректов - ошибка
  if (check.finalStatus === 404) return '❌'; // Редирект на 404 - ошибка (если это не прямой 404)
  if (check.finalStatus !== 200) return '❌'; // Некорректный конечный статус
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return '✅';
  return '⚠️';
}

function getOldExtensionMessage(check: any, targetUrl: string): string {
  if (check.firstStatus === 404) return 'Всё ок (404)';
  if (check.redirectCount > 1) return `Цепочка редиректов (${check.redirectCount})`;
  if (check.finalStatus === 404) return 'Редирект на 404';
  if (check.finalStatus !== 200) return `Ошибка: статус ${check.finalStatus}`;
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return 'Прямой редирект';
  return 'Необработанный старый формат';
}

function analyze404(check: any): '✅' | '❌' | '⚠️' {
  if (check.finalStatus === 404 && check.redirectCount === 0) return '✅';
  if (check.finalStatus === 404 && check.redirectCount > 0) return '⚠️';
  if (check.finalStatus === 200) return '❌';
  if (check.firstStatus === 301 || check.firstStatus === 302 || check.firstStatus === 308) return '⚠️';
  return '❌';
}

function get404Message(check: any): string {
  if (check.finalStatus === 404 && check.redirectCount === 0) return 'Всё ок';
  if (check.finalStatus === 404 && check.redirectCount > 0) return `Цепочка редиректов (${check.redirectCount})`;
  if (check.finalStatus === 200) return '200 (soft 404)';
  if (check.firstStatus === 301 || check.firstStatus === 302 || check.firstStatus === 308) return 'Редирект на 404';
  return 'Некорректная обработка';
}

function checkCanonical(html: string, expectedUrl: string): boolean {
  try {
    const $ = cheerio.load(html);
    const canonical = $('link[rel="canonical"]').attr('href');
    if (!canonical) return false;
    return normalizeUrl(canonical) === normalizeUrl(expectedUrl);
  } catch {
    return false;
  }
}

async function parseInternalLinks(baseUrl: string, html: string): Promise<string[]> {
  try {
    const $ = cheerio.load(html);
    const links: Set<string> = new Set();
    const parsedBase = new URL(baseUrl);
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      
      try {
        const absoluteUrl = new URL(href, baseUrl);
        if (absoluteUrl.hostname === parsedBase.hostname && 
            absoluteUrl.pathname !== '/' && 
            absoluteUrl.pathname.length > 1) {
          links.add(absoluteUrl.href);
        }
      } catch (e) {}
    });
    
    return Array.from(links).slice(0, 5);
  } catch {
    return [];
  }
}
