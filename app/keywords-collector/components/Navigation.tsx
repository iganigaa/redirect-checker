import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const tools = [
    { name: 'Redirect Checker', path: '/', icon: '🔄' },
    { name: 'Clean-param Generator', path: '/clean-param', icon: '🧹' },
    { name: 'Robots.txt Tester', path: '/robots-tester', icon: '🤖' },
    { name: 'Traffic Calculator', path: '/traffic-calculator', icon: '📊' },
    { name: 'Sitemap Validator', path: '/sitemap-validator', icon: '🗺️' },
    { name: 'Keywords Collector', path: '/keywords-collector', icon: '🔍' },
  ];

  return (
    <nav className="bg-white shadow-lg border-b-4 border-purple-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🛠️</span>
            <span className="text-xl font-bold text-gray-900">SEO Tools</span>
          </div>
          
          <div className="hidden md:flex space-x-1">
            {tools.map((tool) => (
              <Link
                key={tool.path}
                href={tool.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === tool.path
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <span className="mr-1">{tool.icon}</span>
                {tool.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-gray-700 hover:text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden pb-4 space-y-2">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              href={tool.path}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === tool.path
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-purple-50'
              }`}
            >
              <span className="mr-2">{tool.icon}</span>
              {tool.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
