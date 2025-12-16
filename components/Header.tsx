'use client';

import { useEffect, useState } from 'react';

function Header() {
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
      className={`h-16 bg-white border-b border-gray-200 fixed top-0 z-30 flex items-center px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
        collapsed ? 'left-0 lg:left-16' : 'left-0 lg:left-64'
      } right-0`}
    >
      {/* Пустой header - поиск и пользователь удалены по требованию */}
    </div>
  );
}

export default Header;