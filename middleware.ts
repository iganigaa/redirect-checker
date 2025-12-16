import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  let pathname = url.pathname;
  const protocol = request.nextUrl.protocol;
  
  let needsRedirect = false;
  let redirectCode = 301; // По умолчанию постоянный редирект 301
  
  // 1. Редирект WWW -> без WWW (для основного домена)
  if (hostname.startsWith('www.')) {
    url.host = hostname.replace('www.', '');
    needsRedirect = true;
  }
  
  // 2. Редирект с vercel.app на основной домен
  if (hostname.includes('vercel.app')) {
    url.host = 'i-burdukov.ru';
    url.protocol = 'https';
    needsRedirect = true;
  }
  
  // 3. HTTP -> HTTPS (для основного домена)
  if (protocol === 'http:' && !hostname.includes('localhost') && !hostname.includes('vercel.app')) {
    url.protocol = 'https';
    needsRedirect = true;
  }
  
  // 4. Редирект index-файлов на главную
  if (pathname === '/index.html' || pathname === '/index.php' || pathname === '/index.htm') {
    pathname = '/';
    needsRedirect = true;
  }
  
  // 5. Нормализация слешей: убираем множественные И trailing slash за один раз
  if (pathname !== '/') {
    // Сначала убираем множественные слеши
    const normalizedPath = pathname.replace(/\/+/g, '/');
    // Затем убираем trailing slash (если это не API маршрут)
    const finalPath = !normalizedPath.startsWith('/api/') && normalizedPath.endsWith('/') 
      ? normalizedPath.slice(0, -1) 
      : normalizedPath;
    
    if (finalPath !== pathname) {
      pathname = finalPath;
      needsRedirect = true;
    }
  }
  
  // Применяем все изменения к URL
  url.pathname = pathname;
  
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

