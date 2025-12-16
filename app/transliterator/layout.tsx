import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Транслитератор - Генератор SEO-friendly URL | Игорь Бурдуков',
  description: 'Транслитерация русского текста в латиницу по правилам Яндекс. Создание правильных ЧПУ (человекопонятных URL) для SEO.',
  keywords: 'транслитерация, чпу, seo url, транслит, яндекс транслит, url generator, slug generator',
  openGraph: {
    title: 'Транслитератор - Генератор SEO-friendly URL',
    description: 'Создание правильных ЧПУ из русского текста по правилам Яндекс',
    type: 'website',
  }
};

export default function TransliteratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

