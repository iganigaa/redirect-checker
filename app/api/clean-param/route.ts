import { NextRequest, NextResponse } from 'next/server';

const ANALYTICS_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'fbclid', 'yclid', 'ref', 'referrer', '_ga', 'mc_cid', 'mc_eid'
];

const NAVIGATION_PARAMS = [
  'page', 'p', 'sort', 'order', 'view', 'limit', 'offset', 'from', 'per_page'
];

const CONTENT_PARAMS = [
  'id', 'product_id', 'article', 'slug', 'tag', 'category', 'search', 'q', 'query'
];

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'Необходим список URL' }, { status: 400 });
    }

    const result = analyzeUrls(urls);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Ошибка обработки' }, { status: 500 });
  }
}

function analyzeUrls(urls: string[]) {
  const paramsMap = new Map<string, Set<string>>(); // param -> Set of paths
  const allParams = new Set<string>();

  // Парсим все URL
  urls.forEach(urlString => {
    try {
      const url = new URL(urlString);
      const path = url.pathname.split('/').slice(0, -1).join('/') + '/'; // путь до последнего слеша
      
      url.searchParams.forEach((value, key) => {
        allParams.add(key);
        
        if (!paramsMap.has(key)) {
          paramsMap.set(key, new Set());
        }
        paramsMap.get(key)!.add(path);
      });
    } catch (e) {
      // Игнорируем невалидные URL
    }
  });

  // Классифицируем параметры
  const analytics: string[] = [];
  const navigation: { [path: string]: string[] } = {};
  const content: string[] = [];
  const warnings: string[] = [];

  paramsMap.forEach((paths, param) => {
    const paramLower = param.toLowerCase();
    
    // Аналитические параметры
    if (ANALYTICS_PARAMS.some(ap => paramLower.includes(ap))) {
      analytics.push(param);
      return;
    }
    
    // Содержательные параметры
    if (CONTENT_PARAMS.some(cp => paramLower.includes(cp))) {
      content.push(param);
      warnings.push(`Параметр '${param}' не включён, т.к. влияет на содержимое`);
      return;
    }
    
    // Навигационные параметры
    if (NAVIGATION_PARAMS.some(np => paramLower.includes(np)) || paths.size > 1) {
      // Группируем по путям
      const pathsArray = Array.from(paths);
      const commonPath = findCommonPath(pathsArray);
      
      if (!navigation[commonPath]) {
        navigation[commonPath] = [];
      }
      navigation[commonPath].push(param);
      return;
    }
    
    // Неизвестные параметры - считаем навигационными
    const pathsArray = Array.from(paths);
    const commonPath = findCommonPath(pathsArray);
    
    if (!navigation[commonPath]) {
      navigation[commonPath] = [];
    }
    navigation[commonPath].push(param);
  });

  // Формируем директивы
  const directives: string[] = [];

  // Аналитика (глобально)
  if (analytics.length > 0) {
    directives.push(`Clean-param: ${analytics.join('&')}`);
  }

  // Навигация (с путями)
  Object.entries(navigation).forEach(([path, params]) => {
    if (params.length > 0) {
      const directive = `Clean-param: ${params.join('&')}${path !== '/' ? ' ' + path : ''}`;
      
      // Проверка лимита
      if (directive.length > 500) {
        warnings.push(`Директива для ${path} превышает 500 символов. Разбейте на несколько.`);
      }
      
      directives.push(directive);
    }
  });

  return {
    groups: {
      analytics,
      navigation,
      content
    },
    directives,
    warnings
  };
}

function findCommonPath(paths: string[]): string {
  if (paths.length === 0) return '/';
  if (paths.length === 1) return paths[0];
  
  // Находим общий префикс путей
  const parts = paths[0].split('/').filter(Boolean);
  let commonPath = '/';
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const allMatch = paths.every(p => p.split('/')[i + 1] === part);
    
    if (allMatch) {
      commonPath += part + '/';
    } else {
      break;
    }
  }
  
  return commonPath;
}
