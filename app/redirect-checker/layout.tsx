import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirect Checker - Проверка редиректов и цепочек перенаправлений | Игорь Бурдуков',
  description: 'Бесплатный инструмент для проверки редиректов сайта: HTTPS, WWW, слеши, регистр, canonical. Анализ цепочек редиректов и рекомендации по исправлению.',
  keywords: 'redirect checker, проверка редиректов, 301 редирект, цепочка редиректов, canonical, SEO инструмент',
  openGraph: {
    title: 'Redirect Checker - Проверка редиректов сайта',
    description: 'Проверьте редиректы вашего сайта: HTTPS, WWW, слеши, регистр, canonical',
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

