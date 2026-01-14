import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Переводчик текстов - DeepSeek V3 | Игорь Бурдуков',
  description: 'Умный перевод больших текстов через DeepSeek V3 с чанкированием. Быстрая параллельная обработка до 100k+ символов.',
  keywords: 'ai translator, deepseek v3, перевод текстов, machine translation, openrouter, ai перевод, переводчик с чанкированием',
  alternates: {
    canonical: '/translator',
  },
  openGraph: {
    title: 'AI Переводчик текстов - DeepSeek V3',
    description: 'Умный перевод больших текстов через DeepSeek V3 с чанкированием',
    type: 'website',
  }
};

export default function TranslatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
