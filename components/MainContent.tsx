'use client';

import { useEffect, useState } from 'react';
import Header from './Header';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) setCollapsed(JSON.parse(saved));

    const handleToggle = () => {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved) setCollapsed(JSON.parse(saved));
    };

    window.addEventListener('sidebarToggle', handleToggle);
    window.addEventListener('storage', handleToggle);

    return () => {
      window.removeEventListener('sidebarToggle', handleToggle);
      window.removeEventListener('storage', handleToggle);
    };
  }, []);

  return (
    <div 
      className={`w-full min-h-screen transition-all duration-300 ${
        collapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}
    >
      <Header />
      <main className="mt-16 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

