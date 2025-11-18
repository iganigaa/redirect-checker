'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  Wrench,
  FileText,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft,
  Settings,
  TrendingUp,
  Map,
  Search,
  Languages,
  Sparkles,
} from 'lucide-react';

const tools = [
  { name: 'Redirect Checker', href: '/redirect-checker', icon: ArrowRightLeft },
  { name: 'Clean-param', href: '/clean-param', icon: Settings },
  { name: 'Robots Tester', href: '/robots-tester', icon: FileText },
  { name: 'Traffic Calculator', href: '/traffic-calculator', icon: TrendingUp },
  { name: 'Sitemap Validator', href: '/sitemap-validator', icon: Map },
  { name: 'Keywords Collector', href: '/keywords-collector', icon: Search },
  { name: 'Транслитератор', href: '/transliterator', icon: Languages },
  { name: 'URL Cleaner', href: '/url-cleaner', icon: Sparkles },
];


export default function Sidebar() {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(true);

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      position: 'fixed',
      left: 0,
      top: 0,
      overflowY: 'auto',
      padding: '20px 0',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px', marginBottom: '30px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
          }}>
            SEO
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#111' }}>
            SEO Platform
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '0 10px' }}>
        {/* Главная */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 15px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: pathname === '/' ? '#667eea' : '#6b7280',
            background: pathname === '/' ? '#f3f4f6' : 'transparent',
            marginBottom: '5px',
            fontWeight: pathname === '/' ? '600' : '400',
          }}
        >
          <Home size={20} />
          <span>Главная</span>
        </Link>

        {/* Инструменты (выпадающий список) */}
        <div style={{ marginBottom: '5px' }}>
          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 15px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#6b7280',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '400',
              fontSize: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Wrench size={20} />
              <span>Инструменты</span>
            </div>
            {toolsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Подменю инструментов */}
          {toolsOpen && (
            <div style={{ marginLeft: '20px', marginTop: '5px' }}>
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = pathname === tool.href;

                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 15px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: isActive ? '#667eea' : '#9ca3af',
                      background: isActive ? '#f3f4f6' : 'transparent',
                      marginBottom: '3px',
                      fontSize: '0.9rem',
                      fontWeight: isActive ? '600' : '400',
                    }}
                  >
                    <Icon size={18} />
                    <span>{tool.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Блог */}
        <Link
          href="/blog"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 15px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: pathname.startsWith('/blog') ? '#667eea' : '#6b7280',
            background: pathname.startsWith('/blog') ? '#f3f4f6' : 'transparent',
            marginBottom: '5px',
            fontWeight: pathname.startsWith('/blog') ? '600' : '400',
          }}
        >
          <FileText size={20} />
          <span>Блог</span>
        </Link>
      </nav>
    </aside>
  );
}