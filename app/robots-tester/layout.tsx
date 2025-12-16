import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Robots.txt Tester - Проверка и анализ robots.txt | Игорь Бурдуков',
  description: 'Интерактивный тестер robots.txt с визуальным сравнением правил для разных поисковых ботов. Проверка директив Googlebot, Yandex, Bing.',
  keywords: 'robots.txt, тестер robots, проверка robots.txt, googlebot, yandex bot, disallow, sitemap',
  openGraph: {
    title: 'Robots.txt Tester - Проверка robots.txt',
    description: 'Интерактивное сравнение правил robots.txt для разных поисковых ботов',
    type: 'website',
  }
};

export default function RobotsTesterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

