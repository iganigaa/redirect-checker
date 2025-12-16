import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'REDIRECT CHECKER: проверка 11 типов редиректов бесплатно за 30 секунд',
  description: 'Автоматическая проверка HTTPS, WWW, trailing slash, цепочек редиректов для Google/Yandex. Экспорт CSV, эмуляция Googlebot. Бесплатно.',
  keywords: 'redirect checker, проверка редиректов, 301 редирект, 302 редирект, цепочка редиректов, canonical, trailing slash, SEO инструмент, googlebot',
  authors: [{ name: 'Игорь Бурдуков' }],
  alternates: {
    canonical: '/redirect-checker',
  },
  openGraph: {
    title: 'REDIRECT CHECKER — проверка редиректов для SEO',
    description: 'Автоматическая проверка 11 критических сценариев редиректов: HTTPS, WWW, trailing slash, регистр URL, canonical-теги. Результат за 15-30 секунд.',
    type: 'website',
  }
};

export default function RedirectCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

