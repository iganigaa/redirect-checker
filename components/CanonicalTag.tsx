'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function CanonicalTag() {
  const pathname = usePathname();

  useEffect(() => {
    // Удаляем существующий canonical если есть
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Создаем canonical URL без trailing slash и без query параметров
    const baseUrl = 'https://i-burdukov.ru';
    const cleanPath = pathname === '/' ? '' : pathname.replace(/\/$/, '');
    const canonicalUrl = `${baseUrl}${cleanPath}`;

    // Добавляем новый canonical тег
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = canonicalUrl;
    document.head.appendChild(link);

    // Cleanup при размонтировании
    return () => {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.remove();
      }
    };
  }, [pathname]);

  return null;
}

