import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Если запрос идет с vercel.app домена - блокируем индексацию
  if (hostname.includes('vercel.app')) {
    const robotsTxt = `# Этот технический домен не должен индексироваться
User-agent: *
Disallow: /

# Основной сайт: https://i-burdukov.ru
`;
    
    return new Response(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
  
  // Для основного домена - разрешаем индексацию
  const robotsTxt = `# Robots.txt для i-burdukov.ru
User-agent: *
Allow: /

# Sitemap location
Sitemap: https://i-burdukov.ru/sitemap.xml

# Crawl-delay для всех ботов
Crawl-delay: 1

# Яндекс директивы для очистки параметров
User-agent: Yandex
Clean-param: utm_source&utm_medium&utm_campaign&gclid&fbclid&yclid

# Не индексировать API routes
Disallow: /api/
`;
  
  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

