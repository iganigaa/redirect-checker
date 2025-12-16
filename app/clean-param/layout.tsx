import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clean-param Generator - Генератор директив для robots.txt | Игорь Бурдуков',
  description: 'Автоматический генератор директив Clean-param для robots.txt. Анализ GET-параметров и создание правил для Яндекса. Уменьшение дублей в индексе.',
  keywords: 'clean-param, robots.txt, яндекс, get параметры, дубли страниц, краулинговый бюджет',
  openGraph: {
    title: 'Clean-param Generator - Генератор для robots.txt',
    description: 'Автоматический анализ GET-параметров и генерация директив Clean-param для Яндекса',
    type: 'website',
  }
};

export default function CleanParamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

