'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Home,
  Wrench,
  FileText,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft,
  Settings,
  TrendingUp,
  Languages,
  Sparkles,
  Menu,
  X,
  Network,
  ShoppingCart,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';

const tools = [
  { name: 'Redirect Checker', href: '/redirect-checker', icon: ArrowRightLeft },
  { name: 'Clean-param', href: '/clean-param', icon: Settings },
  { name: 'Robots Tester', href: '/robots-tester', icon: FileText },
  { name: 'Traffic Calculator', href: '/traffic-calculator', icon: TrendingUp },
  { name: 'Транслитератор', href: '/transliterator', icon: Languages },
  { name: 'URL Cleaner', href: '/url-cleaner', icon: Sparkles },
  { name: 'Knowledge Graph', href: '/knowledge-graph', icon: Network },
  { name: 'E-commerce', href: '/e-commerce-generator', icon: ShoppingCart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Сохранять состояние в localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) setCollapsed(JSON.parse(saved));
  }, []);

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    // Триггерим событие для обновления layout
    window.dispatchEvent(new Event('sidebarToggle'));
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`px-5 mb-8 ${collapsed ? 'px-3' : ''}`}>
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            SEO
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
              SEO Platform
            </span>
          )}
        </Link>
      </div>

      {/* Collapse Button (Desktop) */}
      <button
        onClick={toggleCollapsed}
        className="hidden lg:flex absolute top-5 -right-3 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center hover:bg-gray-50 transition-colors z-50 shadow-sm"
        title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
      >
        {collapsed ? <ChevronRightIcon size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <nav className={`px-2.5 ${collapsed ? 'px-1.5' : ''}`}>
        {/* Главная */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center gap-3 ${collapsed ? 'px-2 justify-center' : 'px-4'} py-2.5 rounded-lg no-underline mb-1 transition-colors ${
            pathname === '/'
              ? 'text-purple-600 bg-gray-100 font-semibold'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          title={collapsed ? 'Главная' : ''}
        >
          <Home size={20} className="flex-shrink-0" />
          {!collapsed && <span>Главная</span>}
        </Link>

        {/* Инструменты (выпадающий список) */}
        <div className="mb-1">
          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            className={`w-full flex items-center justify-between ${collapsed ? 'px-2' : 'px-4'} py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 border-none cursor-pointer transition-colors`}
            title={collapsed ? 'Инструменты' : ''}
          >
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
              <Wrench size={20} className="flex-shrink-0" />
              {!collapsed && <span>Инструменты</span>}
            </div>
            {!collapsed && (toolsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
          </button>

          {/* Подменю инструментов */}
          {toolsOpen && !collapsed && (
            <div className="ml-5 mt-1">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = pathname === tool.href;

                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg no-underline mb-1 text-sm transition-colors ${
                      isActive
                        ? 'text-purple-600 bg-gray-100 font-semibold'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tool.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
          
          {/* Collapsed view - show tools as icons */}
          {collapsed && (
            <div className="mt-1">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = pathname === tool.href;

                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-center px-2 py-2 rounded-lg no-underline mb-1 transition-colors ${
                      isActive
                        ? 'text-purple-600 bg-gray-100 font-semibold'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                    title={tool.name}
                  >
                    <Icon size={18} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Блог */}
        <Link
          href="/blog"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center gap-3 ${collapsed ? 'px-2 justify-center' : 'px-4'} py-2.5 rounded-lg no-underline mb-1 transition-colors ${
            pathname.startsWith('/blog')
              ? 'text-purple-600 bg-gray-100 font-semibold'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          title={collapsed ? 'Блог' : ''}
        >
          <FileText size={20} className="flex-shrink-0" />
          {!collapsed && <span>Блог</span>}
        </Link>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white border-r border-gray-200 overflow-y-auto pt-5 z-40 transition-all duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 
          ${collapsed ? 'lg:w-16' : 'lg:w-64'}
          w-72
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}