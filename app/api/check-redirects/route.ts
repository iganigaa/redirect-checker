import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface CheckResult {
  number: number;
  checkName: string;
  url: string;
  expected: string;
  statusCode: number | null;
  redirectChain: string[];
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
    status: chainCheck.redirectCount <= 1 ? '✅' : '⚠️',
    message: chainCheck.redirectCount <= 1 ? 'Оптимальная цепочка' : `Цепочка из ${chainCheck.redirectCount} редиректов`
  });

  return results;
}

async function checkUrlFull(url: string, userAgent: string) {
  const chain: string[] = [url];
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
    }
  }

  return {
    firstStatus,
    finalStatus,
    chain,
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

function analyzeHttpsRedirect(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '❌';
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return '✅';
  return '⚠️';
}

function getHttpsMessage(check: any, targetUrl: string): string {
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return 'Нет редиректа';
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return 'Всё ок';
  return 'Редирект на неправильный URL';
}

function analyzeWwwRedirect(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus === 200) return '❌';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '❌';
  if (check.redirectCount > 1) return '⚠️';
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return '✅';
  return '⚠️';
}

function getWwwMessage(check: any, targetUrl: string): string {
  if (check.firstStatus === 200) return 'Нет редиректа';
  if (check.redirectCount > 1) return 'Несколько редиректов подряд';
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return 'Всё ок';
  return 'Редирект на неправильный URL';
}

function analyzeMultiSlash(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus === 200) return '⚠️';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '❌';
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return '✅';
  return '❌';
}

function getMultiSlashMessage(check: any, targetUrl: string): string {
  if (check.firstStatus === 200) return 'Отдаёт 200';
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return 'Всё ок';
  return 'Ошибка редиректа';
}

function analyzeCaseRedirect(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus === 200) return '⚠️';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '❌';
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return '✅';
  return '❌';
}

function getCaseMessage(check: any, targetUrl: string): string {
  if (check.firstStatus === 200) return 'Дубли по регистру';
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return 'Всё ок';
  return 'Нет редиректа';
}

function analyzeIndexRedirect(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus === 200) return '⚠️';
  if (check.firstStatus === 404) return '✅';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '❌';
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return '✅';
  return '❌';
}

function getIndexMessage(check: any, targetUrl: string): string {
  if (check.firstStatus === 200) return '200 на index-файл';
  if (check.firstStatus === 404) return 'Всё ок (404)';
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return 'Всё ок';
  return 'Нет редиректа';
}

function analyzeSlashConsistency(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus === 200) return '⚠️';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '❌';
  return '✅';
}

function getSlashMessage(check: any, targetUrl: string): string {
  if (check.firstStatus === 200) return 'Несоответствие паттерна';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return 'Нет редиректа';
  return 'Всё ок';
}

function analyzeOldExtension(check: any, targetUrl: string): '✅' | '❌' | '⚠️' {
  if (check.firstStatus === 404) return '✅';
  if (check.firstStatus !== 301 && check.firstStatus !== 308) return '⚠️';
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return '✅';
  return '⚠️';
}

function getOldExtensionMessage(check: any, targetUrl: string): string {
  if (check.firstStatus === 404) return 'Всё ок (404)';
  if (normalizeUrl(check.finalUrl) === normalizeUrl(targetUrl)) return 'Всё ок (редирект)';
  return 'Необработанный старый формат';
}

function analyze404(check: any): '✅' | '❌' | '⚠️' {
  if (check.finalStatus === 404) return '✅';
  if (check.finalStatus === 200) return '❌';
  if (check.firstStatus === 301 || check.firstStatus === 302) return '⚠️';
  return '❌';
}

function get404Message(check: any): string {
  if (check.finalStatus === 404) return 'Всё ок';
  if (check.finalStatus === 200) return '200 (soft 404)';
  if (check.firstStatus === 301 || check.firstStatus === 302) return '302 или 301';
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
