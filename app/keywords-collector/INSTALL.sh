#!/bin/bash

# 🔍 Keywords Collector - Скрипт установки
# Автоматическое копирование файлов в проект redirect-checker

set -e

PROJECT_DIR="$HOME/Desktop/redirect-checker"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Установка Keywords Collector"
echo "================================"
echo ""

# Проверка существования проекта
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Проект не найден: $PROJECT_DIR"
    echo "Укажите путь к проекту:"
    read -r PROJECT_DIR
fi

echo "📁 Проект: $PROJECT_DIR"
echo "📦 Источник: $SOURCE_DIR"
echo ""

# Создание директорий
echo "📂 Создание директорий..."
mkdir -p "$PROJECT_DIR/app/keywords-collector"
mkdir -p "$PROJECT_DIR/app/api/keywords-collector"

# Копирование файлов
echo "📄 Копирование файлов..."

cp "$SOURCE_DIR/app/keywords-collector/page.tsx" "$PROJECT_DIR/app/keywords-collector/page.tsx"
echo "  ✅ app/keywords-collector/page.tsx"

cp "$SOURCE_DIR/app/api/keywords-collector/route.ts" "$PROJECT_DIR/app/api/keywords-collector/route.ts"
echo "  ✅ app/api/keywords-collector/route.ts"

cp "$SOURCE_DIR/components/Navigation.tsx" "$PROJECT_DIR/components/Navigation.tsx"
echo "  ✅ components/Navigation.tsx"

echo ""
echo "✅ Установка завершена!"
echo ""
echo "📝 Следующие шаги:"
echo "1. cd $PROJECT_DIR"
echo "2. npm run dev  # Проверьте локально"
echo "3. git add ."
echo "4. git commit -m \"Add Keywords Collector - 6th SEO tool\""
echo "5. git push origin main"
echo ""
echo "🌐 После деплоя доступно на: /keywords-collector"
echo ""
