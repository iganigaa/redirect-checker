import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'URL Cleaner - Массовая обработка списков URL | Игорь Бурдуков',
  description: 'Онлайн-инструмент для массовой обработки URL: удаление слешей, протоколов, дублей, сортировка, извлечение доменов. 9 полезных функций.',
  keywords: 'url cleaner, обработка url, удаление дублей, извлечение доменов, массовая обработка url',
  openGraph: {
    title: 'URL Cleaner - Массовая обработка URL',
    description: 'Инструмент для работы со списками URL: 9 функций обработки',
    type: 'website',
  }
};

export default function UrlCleanerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

