'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Send } from 'lucide-react';

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

            {/* Telegram Button */}
            <div className="flex items-center justify-center md:justify-start">
              <a
                href="https://t.me/iganiga1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 bg-[#0088cc] rounded-full text-white hover:bg-[#0077b5] transition-colors shadow-md text-sm sm:text-base font-medium"
              >
                <Send className="w-5 h-5" />
                <span>Telegram: @iganiga1</span>
              </a>
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