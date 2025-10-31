import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';

interface Rule {
  type: 'disallow' | 'allow' | 'sitemap' | 'clean-param' | 'crawl-delay' | 'host';
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

export async function POST(request: NextRequest) {
  try {
    const { url, robotsText } = await request.json();
    
    let text = robotsText;
    let fetchedUrl = url;
    let statusCode = 200;

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

function generateHash(text: string): string {
  return crypto.createHash('md5').update(text.toLowerCase().trim()).digest('hex').substring(0, 8);
}

function parseRobotsByAgent(text: string): AgentRules[] {
  const lines = text.split('\n');
  const agents: { [key: string]: AgentRules } = {};
  let currentAgent = '*';
  
  // Инициализируем агента по умолчанию
  agents[currentAgent] = {
    userAgent: currentAgent,
    rules: [],
    recommendations: [],
    warnings: [],
    errors: [],
    cssJsBlocked: false,
    imagesBlocked: false,
    hasCleanParam: false,
    suggestedCleanParams: []
  };
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    // User-agent
    const uaMatch = trimmed.match(/^User-agent:\s*(.+)/i);
    if (uaMatch) {
      currentAgent = uaMatch[1].trim();
      if (!agents[currentAgent]) {
        agents[currentAgent] = {
          userAgent: currentAgent,
          rules: [],
          recommendations: [],
          warnings: [],
          errors: [],
          cssJsBlocked: false,
          imagesBlocked: false,
          hasCleanParam: false,
          suggestedCleanParams: []
        };
      }
      return;
    }
    
    // Disallow
    const disallowMatch = trimmed.match(/^Disallow:\s*(.*)$/i);
    if (disallowMatch) {
      const path = disallowMatch[1].trim();
      agents[currentAgent].rules.push({
        type: 'disallow',
        path,
        hash: generateHash(`disallow:${path}`),
        lineNumber: index + 1
      });
      
      // Проверка на блокировку CSS/JS
      if (path.match(/\.(css|js)$/i) || path.match(/\/(css|js)\//i) || path.includes('*.css') || path.includes('*.js')) {
        agents[currentAgent].cssJsBlocked = true;
      }
      
      // Проверка на блокировку изображений
      if (path.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) || path.includes('*.jpg') || path.includes('*.png')) {
        agents[currentAgent].imagesBlocked = true;
      }
      
      // Извлечение параметров для Clean-param
      const paramMatches = path.match(/[?&]([^=&]+)/g);
      if (paramMatches) {
        paramMatches.forEach(match => {
          const param = match.replace(/[?&]/g, '');
          if (!param.match(/^(utm_|yclid|gclid|fbclid|_ga)/i)) {
            if (!agents[currentAgent].suggestedCleanParams.includes(param)) {
              agents[currentAgent].suggestedCleanParams.push(param);
            }
          }
        });
      }
      
      // Проверка на PAGEN_ и другие параметры пагинации
      if (path.match(/PAGEN_|page=|page_/i)) {
        const pageParam = path.match(/PAGEN_\d+|page|PAGEN_/i);
        if (pageParam) {
          const param = pageParam[0].replace(/\d+/g, '').replace(/[=&]/g, '');
          if (param && !agents[currentAgent].suggestedCleanParams.includes(param)) {
            agents[currentAgent].suggestedCleanParams.push(param);
          }
        }
      }
      
      return;
    }
    
    // Allow
    const allowMatch = trimmed.match(/^Allow:\s*(.*)$/i);
    if (allowMatch) {
      const path = allowMatch[1].trim();
      agents[currentAgent].rules.push({
        type: 'allow',
        path,
        hash: generateHash(`allow:${path}`),
        lineNumber: index + 1
      });
      return;
    }
    
    // Clean-param
    const cleanParamMatch = trimmed.match(/^Clean-param:\s*(.*)$/i);
    if (cleanParamMatch) {
      const path = cleanParamMatch[1].trim();
      agents[currentAgent].hasCleanParam = true;
      agents[currentAgent].rules.push({
        type: 'clean-param',
        path,
        hash: generateHash(`clean-param:${path}`),
        lineNumber: index + 1
      });
      return;
    }
    
    // Sitemap
    const sitemapMatch = trimmed.match(/^Sitemap:\s*(.*)$/i);
    if (sitemapMatch) {
      const path = sitemapMatch[1].trim();
      agents[currentAgent].rules.push({
        type: 'sitemap',
        path,
        hash: generateHash(`sitemap:${path}`),
        lineNumber: index + 1
      });
      return;
    }
    
    // Host
    const hostMatch = trimmed.match(/^Host:\s*(.*)$/i);
    if (hostMatch) {
      const path = hostMatch[1].trim();
      agents[currentAgent].rules.push({
        type: 'host',
        path,
        hash: generateHash(`host:${path}`),
        lineNumber: index + 1
      });
      return;
    }
    
    // Crawl-delay
    const crawlDelayMatch = trimmed.match(/^Crawl-delay:\s*(.*)$/i);
    if (crawlDelayMatch) {
      const path = crawlDelayMatch[1].trim();
      agents[currentAgent].rules.push({
        type: 'crawl-delay',
        path,
        hash: generateHash(`crawl-delay:${path}`),
        lineNumber: index + 1
      });
      return;
    }
  });
  
  // Генерируем рекомендации для каждого агента
  Object.values(agents).forEach(agent => {
    const isGooglebot = agent.userAgent.toLowerCase().includes('google');
    
    // ОШИБКА: Блокировка CSS/JS
    if (agent.cssJsBlocked) {
      agent.errors.push('❌ CSS или JavaScript заблокированы');
      agent.recommendations.push('Разрешите доступ к CSS и JavaScript файлам - поисковики не смогут корректно отрендерить страницы');
      
      if (isGooglebot) {
        agent.recommendations.push('Google требует доступ к CSS/JS для правильного рендеринга страниц');
      }
    }
    
    // ОШИБКА: Блокировка изображений
    if (agent.imagesBlocked) {
      agent.errors.push('❌ Изображения заблокированы');
      agent.recommendations.push('Разрешите доступ к изображениям - они не будут индексироваться в поиске по картинкам');
    }
    
    // Рекомендация по Clean-param
    if (agent.suggestedCleanParams.length > 0 && !agent.hasCleanParam) {
      const isYandex = agent.userAgent.toLowerCase().includes('yandex');
      
      if (isYandex || agent.userAgent === '*') {
        agent.recommendations.push(
          `Добавьте Clean-param: ${agent.suggestedCleanParams.join('&')} для снижения дублей`
        );
      }
    }
    
    // Рекомендация по Sitemap
    const hasSitemap = agent.rules.some(r => r.type === 'sitemap');
    if (!hasSitemap && agent.userAgent === '*') {
      agent.warnings.push('⚠️ Отсутствует Sitemap');
      agent.recommendations.push('Добавьте директиву Sitemap с путём к карте сайта');
    }
    
    // Проверка конфликтов
    const hasDisallowRoot = agent.rules.some(r => r.type === 'disallow' && r.path === '/');
    const hasAllow = agent.rules.some(r => r.type === 'allow');
    if (hasDisallowRoot && hasAllow) {
      agent.warnings.push('⚠️ Конфликт: Disallow: / с директивами Allow');
      agent.recommendations.push('Убедитесь что Allow директивы имеют приоритет над Disallow: /');
    }
  });
  
  return Object.values(agents);
}

function analyzeRobotsTxt(text: string, statusCode: number, url: string) {
  const checks: CheckResult[] = [];
  const lines = text.split('\n');
  
  // Парсим по агентам
  const agentRules = parseRobotsByAgent(text);
  
  // Извлекаем общую информацию
  const userAgents = agentRules.map(a => a.userAgent);
  const allSitemaps = agentRules.flatMap(a => a.rules.filter(r => r.type === 'sitemap').map(r => r.path));
  const hasHost = agentRules.some(a => a.rules.some(r => r.type === 'host'));
  const hasCleanParam = agentRules.some(a => a.hasCleanParam);
  
  // 1. ТЕХНИЧЕСКИЕ ПРОВЕРКИ
  
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
  
  // 2. ДОСТУП К РЕСУРСАМ
  
  const anyCssJsBlocked = agentRules.some(a => a.cssJsBlocked);
  const anyImagesBlocked = agentRules.some(a => a.imagesBlocked);
  
  if (anyCssJsBlocked) {
    checks.push({
      category: 'Доступ к ресурсам',
      check: 'CSS и JavaScript',
      status: '❌',
      message: 'Обнаружена блокировка CSS или JS файлов',
      recommendation: 'Разрешите доступ к CSS/JS - поисковики не смогут правильно отрендерить страницы'
    });
  } else {
    checks.push({
      category: 'Доступ к ресурсам',
      check: 'CSS и JavaScript',
      status: '✅',
      message: 'CSS и JavaScript доступны для индексации'
    });
  }
  
  if (anyImagesBlocked) {
    checks.push({
      category: 'Доступ к ресурсам',
      check: 'Изображения',
      status: '❌',
      message: 'Обнаружена блокировка изображений',
      recommendation: 'Изображения не будут индексироваться в поиске по картинкам'
    });
  } else {
    checks.push({
      category: 'Доступ к ресурсам',
      check: 'Изображения',
      status: '✅',
      message: 'Изображения доступны для индексации'
    });
  }
  
  // 3. СЕМАНТИЧЕСКИЕ ПРОВЕРКИ
  
  if (!hasHost) {
    checks.push({
      category: 'Семантические проверки',
      check: 'Директива Host',
      status: '⚠️',
      message: 'Директива Host отсутствует',
      recommendation: 'Добавьте "Host: yourdomain.ru" для корректной работы с Яндексом'
    });
  } else {
    checks.push({
      category: 'Семантические проверки',
      check: 'Директива Host',
      status: '✅',
      message: 'Директива Host указана'
    });
  }
  
  if (allSitemaps.length === 0) {
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
      message: `Найдено карт сайта: ${allSitemaps.length}`
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
    sitemaps: allSitemaps,
    hasHost,
    hasCleanParam,
    agentRules
  };
}
