import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <div className="relative -mt-16">
            <Search className="w-24 h-24 text-purple-600 mx-auto" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Страница не найдена
        </h2>
        
        <p className="text-lg text-gray-600 mb-8">
          К сожалению, запрашиваемая страница не существует или была перемещена.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            На главную
          </Link>
          
          <Link
            href="/redirect-checker"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Проверить редиректы
          </Link>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Популярные инструменты:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/redirect-checker" className="text-sm text-purple-600 hover:text-purple-700">
              Redirect Checker
            </Link>
            <Link href="/clean-param" className="text-sm text-purple-600 hover:text-purple-700">
              Clean-param
            </Link>
            <Link href="/robots-tester" className="text-sm text-purple-600 hover:text-purple-700">
              Robots Tester
            </Link>
            <Link href="/url-cleaner" className="text-sm text-purple-600 hover:text-purple-700">
              URL Cleaner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

