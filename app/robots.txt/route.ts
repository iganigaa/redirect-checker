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
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.png
Allow: /*.gif
Allow: /*.webp
Allow: /*.svg
Allow: /*.ico
Allow: /*.avif
Allow: /*.css
Allow: /*.js

Disallow: /_next/
Disallow: /_vercel/
Disallow: /api/

User-agent: Yandex
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.png
Allow: /*.gif
Allow: /*.webp
Allow: /*.svg
Allow: /*.ico
Allow: /*.avif
Allow: /*.css
Allow: /*.js

Clean-param: utm_source&utm_medium&utm_campaign&gclid&fbclid&yclid

Sitemap: https://i-burdukov.ru/sitemap.xml
`;
  
  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

