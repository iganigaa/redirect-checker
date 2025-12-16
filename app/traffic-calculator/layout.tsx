import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Traffic Calculator - Калькулятор SEO трафика | Игорь Бурдуков',
  description: 'Прогноз изменения органического трафика на основе роста позиций. Расчет реалистичного и оптимистичного сценариев на основе данных Google Search Console.',
  keywords: 'калькулятор трафика, seo трафик, прогноз трафика, google search console, позиции сайта, ctr',
  alternates: {
    canonical: '/traffic-calculator',
  },
  openGraph: {
    title: 'Traffic Calculator - Калькулятор SEO трафика',
    description: 'Прогноз органического трафика на основе роста позиций в поиске',
    type: 'website',
  }
};

export default function TrafficCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

