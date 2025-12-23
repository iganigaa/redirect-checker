import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Анализатор цен конкурентов | SEO инструменты',
  description: 'Сравнение цен на услуги с конкурентами. Автоматический парсинг прайс-листов и сопоставление услуг с помощью AI.',
  openGraph: {
    title: 'Анализатор цен конкурентов',
    description: 'Сравнение цен на услуги с конкурентами. Автоматический парсинг прайс-листов.',
  },
};

export default function PriceComparatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

