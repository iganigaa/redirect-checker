'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Send, Youtube, MessageCircle } from 'lucide-react';

export default function DashboardHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Author Section */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-12 items-start mb-8 md:mb-12">
          {/* Left - Circular Photo */}
          <div className="relative mx-auto md:mx-0">
            <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-300 flex items-end justify-center overflow-hidden shadow-lg">
              <Image
                src="/фавикон.png"
                alt="Игорь Бурдуков"
                width={256}
                height={280}
                className="object-cover object-top"
                priority
              />
            </div>
          </div>

          {/* Right - Info */}
          <div className="pt-0 md:pt-4">
            {/* Name */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-8 tracking-tight text-center md:text-left">
              Игорь Бурдуков
            </h1>

            {/* Quote Block */}
            <div className="mb-6 md:mb-8">
              <div className="relative">
                <div className="absolute -left-2 md:-left-4 -top-2 text-4xl md:text-6xl text-gray-300 leading-none">
                  "
                </div>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 md:mb-4 pl-4 md:pl-6">
                  В SEO с 2016 года. В данный момент SEO специалист Rush Agency. В рамках Rush Academy провожу ежемесячные вебинары, посвященные SEO, а также онлайн-разборы сайтов.
                </p>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed pl-4 md:pl-6">
                  Собираю для себя полезные штуки на нейросетях, которые ускоряют рабочий процесс. Поэтому и собрал этот сайт, чтобы все хранилось в одном месте.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 mb-6 md:mb-8">
              <div className="text-center md:text-left">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-2">
                  50<span className="text-xl sm:text-2xl md:text-3xl">+</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 leading-snug">
                  сайтов продвигал<br />лично
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-2">
                  100<span className="text-xl sm:text-2xl md:text-3xl">+</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 leading-snug">
                  сайтов разбирал,<br />консультировал
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-2">
                  1000<span className="text-xl sm:text-2xl md:text-3xl">+</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 leading-snug">
                  ТЗшек было<br />поставлено
                </div>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 mb-4">
              <a
                href="https://t.me/yourhandle"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0088cc] rounded-full flex items-center justify-center text-white hover:bg-[#0077b5] transition-colors shadow-md"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a
                href="https://youtube.com/@yourchannel"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FF0000] rounded-full flex items-center justify-center text-white hover:bg-[#cc0000] transition-colors shadow-md"
              >
                <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a
                href="https://vk.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0077FF] rounded-full flex items-center justify-center text-white hover:bg-[#0066dd] transition-colors shadow-md"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M13.162 18.994c.609 0 .858-.406.851-.915-.031-1.917.714-2.949 2.059-1.604 1.488 1.488 1.796 2.519 3.603 2.519h3.2c.808 0 1.126-.26 1.126-.668 0-.863-1.421-2.386-2.625-3.504-1.686-1.565-1.765-1.602-.313-3.486 1.801-2.339 4.157-5.336 2.073-5.336h-3.981c-.772 0-.828.435-1.103 1.083-.995 2.347-2.886 5.387-3.604 4.922-.751-.485-.407-2.406-.35-5.261.015-.754.011-1.271-.57-1.611-.465-.273-1.389-.266-1.746-.266-1.185 0-2.354.045-2.354 1.028 0 .322.253.753.838.753 1.062 0 .97 3.405.97 3.405s.637 6.036-.134 6.725c-.827.739-1.98-.546-3.467-2.881-1.064-1.676-2.052-4.182-2.052-4.182s-.165-.364-.667-.364H2.427s-.818.046-.818.818c0 .727 2.648 6.845 5.648 10.293 2.754 3.164 5.906 2.956 5.906 2.956z" />
                </svg>
              </a>
              <a
                href="https://wa.me/yourphone"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-12 sm:h-12 bg-[#25D366] rounded-full flex items-center justify-center text-white hover:bg-[#1eb855] transition-colors shadow-md"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>

            <div className="text-center md:text-left">
              <div className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                Я всегда открыт для общения
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                И пожалуйста, как развивать бизнес в соцсетях
              </div>
            </div>
          </div>
        </div>

        {/* SEO Tools Section */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
            SEO Инструменты
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Link
              href="/redirect-checker"
              className="bg-white hover:bg-blue-50 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 transition-all hover:shadow-md group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl sm:text-2xl">🔄</span>
                <span className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600">
                  Redirect Checker
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Проверка редиректов и цепочек перенаправлений
              </p>
            </Link>

            <Link
              href="/clean-param"
              className="bg-white hover:bg-purple-50 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 transition-all hover:shadow-md group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl sm:text-2xl">🧹</span>
                <span className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-purple-600">
                  Clean-param
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Очистка параметров URL
              </p>
            </Link>

            <Link
              href="/robots-tester"
              className="bg-white hover:bg-green-50 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 transition-all hover:shadow-md group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl sm:text-2xl">🤖</span>
                <span className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-green-600">
                  Robots Tester
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Тестирование robots.txt
              </p>
            </Link>

            <Link
              href="/traffic-calculator"
              className="bg-white hover:bg-orange-50 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 transition-all hover:shadow-md group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl sm:text-2xl">📊</span>
                <span className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-orange-600">
                  Traffic Calculator
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Расчет потенциального трафика
              </p>
            </Link>

            <Link
              href="/transliterator"
              className="bg-white hover:bg-teal-50 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 transition-all hover:shadow-md group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl sm:text-2xl">🔤</span>
                <span className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-teal-600">
                  Транслитератор
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Генератор SEO-friendly URL из русского текста
              </p>
            </Link>

            <Link
              href="/url-cleaner"
              className="bg-white hover:bg-amber-50 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 transition-all hover:shadow-md group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl sm:text-2xl">🧼</span>
                <span className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-amber-600">
                  URL Cleaner
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Массовая обработка списков URL (9 функций)
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}