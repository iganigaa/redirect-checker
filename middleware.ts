import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  let pathname = url.pathname;
  
  let needsRedirect = false;
  
  // Редирект index-файлов на главную
  if (pathname === '/index.html' || pathname === '/index.php' || pathname === '/index.htm') {
    pathname = '/';
    needsRedirect = true;
  }
  
  // Нормализация слешей
  if (pathname !== '/') {
    const normalizedPath = pathname.replace(/\/+/g, '/');
    const finalPath = !normalizedPath.startsWith('/api/') && normalizedPath.endsWith('/') 
      ? normalizedPath.slice(0, -1) 
      : normalizedPath;
    
    if (finalPath !== pathname) {
      pathname = finalPath;
      needsRedirect = true;
    }
  }
  
  url.pathname = pathname;
  
  if (needsRedirect) {
    return NextResponse.redirect(url, 301);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
