'use client';

function Header() {
  return (
    <div className="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 lg:left-64 right-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-gray-600 ml-12 lg:ml-0">
        <span>🔍</span>
        <span className="hidden sm:inline">Поиск</span>
      </div>
      <div className="flex items-center gap-2 text-gray-600">
        <span>👤</span>
        <span className="hidden sm:inline">Пользователь</span>
      </div>
    </div>
  );
}

export default Header;