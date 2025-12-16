import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const pathname = url.pathname;
  
  // 1. Редирект WWW -> без WWW (для основного домена)
  if (hostname.startsWith('www.')) {
    url.host = hostname.replace('www.', '');
    return NextResponse.redirect(url, 301);
  }
  
  // 2. Редирект с vercel.app на основной домен
  if (hostname.includes('vercel.app')) {
    url.host = 'i-burdukov.ru';
    url.protocol = 'https';
    return NextResponse.redirect(url, 301);
  }
  
  // 3. Редирект index-файлов на главную
  if (pathname === '/index.html' || pathname === '/index.php' || pathname === '/index.htm') {
    url.pathname = '/';
    return NextResponse.redirect(url, 301);
  }
  
  // 4. Нормализация множественных слешей (/// -> /)
  if (pathname.includes('//')) {
    url.pathname = pathname.replace(/\/+/g, '/');
    return NextResponse.redirect(url, 308);
  }
  
  // 5. Trailing slash нормализация (убираем слеш для не-главных страниц)
  if (pathname !== '/' && pathname.endsWith('/') && !pathname.startsWith('/api/')) {
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 308);
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

