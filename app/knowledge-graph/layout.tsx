import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knowledge Graph Search - Поиск по графу знаний Google | Игорь Бурдуков',
  description: 'Поиск сущностей в Google Knowledge Graph API. Получение структурированной информации о персонах, организациях, местах, событиях.',
  keywords: 'knowledge graph, google knowledge graph, граф знаний, поиск сущностей, structured data',
  alternates: {
    canonical: '/knowledge-graph',
  },
  openGraph: {
    title: 'Knowledge Graph Search - Поиск в графе знаний Google',
    description: 'Поиск и анализ сущностей в Google Knowledge Graph',
    type: 'website',
  }
};

export default function KnowledgeGraphLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

