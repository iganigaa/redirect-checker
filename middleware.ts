import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const pathname = url.pathname;
  const protocol = request.nextUrl.protocol;
  
  let needsRedirect = false;
  let redirectCode = 308; // По умолчанию постоянный редирект
  
  // 1. Редирект WWW -> без WWW (для основного домена)
  if (hostname.startsWith('www.')) {
    url.host = hostname.replace('www.', '');
    needsRedirect = true;
    redirectCode = 301; // Для WWW используем 301
  }
  
  // 2. Редирект с vercel.app на основной домен
  if (hostname.includes('vercel.app')) {
    url.host = 'i-burdukov.ru';
    url.protocol = 'https';
    needsRedirect = true;
    redirectCode = 301;
  }
  
  // 3. HTTP -> HTTPS (для основного домена)
  if (protocol === 'http:' && !hostname.includes('localhost') && !hostname.includes('vercel.app')) {
    url.protocol = 'https';
    needsRedirect = true;
    if (redirectCode !== 301) {
      redirectCode = 308;
    }
  }
  
  // 4. Редирект index-файлов на главную
  if (pathname === '/index.html' || pathname === '/index.php' || pathname === '/index.htm') {
    url.pathname = '/';
    needsRedirect = true;
    redirectCode = 301;
  }
  
  // 5. Нормализация множественных слешей (/// -> /)
  if (pathname.includes('//')) {
    url.pathname = pathname.replace(/\/+/g, '/');
    needsRedirect = true;
  }
  
  // 6. Trailing slash нормализация (убираем слеш для не-главных страниц)
  // Применяем ПОСЛЕ нормализации множественных слешей
  if (url.pathname !== '/' && url.pathname.endsWith('/') && !url.pathname.startsWith('/api/')) {
    url.pathname = url.pathname.slice(0, -1);
    needsRedirect = true;
  }
  
  // Выполняем редирект только если что-то изменилось
  if (needsRedirect) {
    return NextResponse.redirect(url, redirectCode);
  }
  
  return NextResponse.next();
}

// Применяем middleware ко всем путям
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

