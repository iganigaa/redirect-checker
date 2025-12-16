import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Если запрос идет с vercel.app домена - редиректим на основной
  if (hostname.includes('vercel.app')) {
    const url = request.nextUrl.clone();
    url.host = 'i-burdukov.ru';
    url.protocol = 'https';
    
    return NextResponse.redirect(url, 301);
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

