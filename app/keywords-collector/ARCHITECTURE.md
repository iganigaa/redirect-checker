# 🏗️ Архитектура Keywords Collector

## 📐 Схема работы

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│                 /keywords-collector/page.tsx                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Ввод данных:                                             │
│     ├── API ключ Keys.so                                     │
│     ├── Список URL (textarea или .txt файл)                  │
│     ├── Максимальная позиция (default: 10)                   │
│     └── Минимальная !Частотность (default: 1)               │
│                                                               │
│  2. Отправка POST запроса:                                   │
│     └── /api/keywords-collector                              │
│                                                               │
│  3. Получение данных через SSE:                              │
│     ├── data: {type: 'status', ...}  → Обновление прогресса  │
│     ├── data: {type: 'result', ...}  → Добавление результатов│
│     └── data: {type: 'complete'}     → Завершение обработки  │
│                                                               │
│  4. Отображение:                                             │
│     ├── Прогресс-бары для каждого URL                        │
│     ├── Таблица результатов (real-time)                      │
│     └── Кнопка экспорта в CSV                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API ROUTE (Server)                         │
│              /api/keywords-collector/route.ts                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Для каждого URL:                                            │
│                                                               │
│  1. Парсинг URL:                                             │
│     ├── Извлечение домена: example.com                       │
│     └── Извлечение пути: /category/product/                  │
│                                                               │
│  2. Пагинация API Keys.so:                                   │
│     ├── Страница 1 → GET /bypage?page=1&filter=pos<=10       │
│     ├── Страница 2 → GET /bypage?page=2&filter=pos<=10       │
│     └── ...до последней страницы                             │
│                                                               │
│  3. Фильтрация данных:                                       │
│     ├── API фильтрует: pos <= maxPosition                    │
│     └── Сервер фильтрует: wsk > minFrequency                 │
│                                                               │
│  4. Отправка промежуточных результатов:                      │
│     └── SSE stream → Frontend                                │
│                                                               │
│  5. Обработка ошибок:                                        │
│     ├── API недоступен → Добавить строку с ошибкой           │
│     └── Продолжить обработку остальных URL                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    KEYS.SO API                               │
│          https://api.keys.so/report/simple/               │
│            organic/keywords/bypage                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Request:                                                     │
│  ├── Headers:                                                │
│  │   └── X-Keyso-TOKEN: your_api_key                         │
│  └── Query Params:                                           │
│      ├── domain: example.com                                 │
│      ├── page_url: /category/product/                        │
│      ├── base: msk                                           │
│      ├── per_page: 100                                       │
│      ├── page: 1                                             │
│      └── filter: pos<=10                                     │
│                                                               │
│  Response:                                                    │
│  {                                                            │
│    "data": [                                                  │
│      {                                                        │
│        "word": "ключевое слово",                             │
│        "pos": 5,                                             │
│        "ws": 1200,        // Частотность                     │
│        "wsk": 800,        // !Частотность                    │
│        "competition": "средняя"                              │
│      },                                                       │
│      ...                                                      │
│    ],                                                         │
│    "current_page": 1,                                        │
│    "last_page": 3                                            │
│  }                                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Поток данных (Data Flow)

### 1. Инициализация

```typescript
User Input → Frontend State → POST Request
     ↓              ↓              ↓
  API Key      URL List      /api/keywords-collector
  Filters     minFrequency
             maxPosition
```

### 2. Обработка (для каждого URL)

```typescript
URL Processing Loop:
  │
  ├─→ Extract Domain + Page URL
  │
  ├─→ Page 1 Request → Keys.so API
  │       ↓
  │   [wait 1s]
  │       ↓
  ├─→ Filter Results (wsk > minFrequency)
  │       ↓
  ├─→ Send SSE: {type: 'status', progress: 20%}
  │       ↓
  ├─→ Send SSE: {type: 'result', data: [...]}
  │       ↓
  ├─→ Page 2 Request → Keys.so API
  │       ↓
  └─→ ... repeat until last_page
```

### 3. Real-time Updates

```typescript
Server (SSE)           Frontend
    │                      │
    ├─ status ────────────→│ Update progress bar
    │                      │
    ├─ result ────────────→│ Add rows to table
    │                      │
    ├─ status ────────────→│ Update keywords count
    │                      │
    └─ complete ──────────→│ Enable export button
```

---

## 🎨 Компоненты UI

### Input Form
```
┌──────────────────────────────────────┐
│ 🔑 API ключ Keys.so                  │
│ [____________________________]       │
│                                      │
│ 📝 Список URL                        │
│ [____________________________]       │
│ [____________________________]       │
│ [____________________________]       │
│ 📁 Загрузить из .txt | 3 URL         │
│                                      │
│ Макс. позиция: [10▼] | !Частота: [1]│
│                                      │
│ [🚀 Собрать ключевые слова]          │
└──────────────────────────────────────┘
```

### Processing Status
```
┌──────────────────────────────────────┐
│ 📊 Статус обработки                  │
├──────────────────────────────────────┤
│ example.com/page1/                   │
│ ████████████░░░░░░░░░░ 60% │ ✅      │
│ Найдено: 47 ключевых слов            │
├──────────────────────────────────────┤
│ example.com/page2/                   │
│ ████████░░░░░░░░░░░░░░ 40% │ 🔄      │
│ Найдено: 23 ключевых слова           │
└──────────────────────────────────────┘
```

### Results Table
```
┌────────────────────────────────────────────────────────────┐
│ 📈 Результаты (120 ключевых слов)  [📥 Экспорт в CSV]      │
├─────────┬──────────────┬─────┬──────┬──────┬──────┬────────┤
│ URL     │ Ключевое слово│ Поз │ Част │!Част │ Конк │ Дата   │
├─────────┼──────────────┼─────┼──────┼──────┼──────┼────────┤
│ page1/  │ термос 1 литр│  3  │ 1200 │ 800  │средняя│2024-10 │
│ page1/  │ купить термос│  5  │ 2500 │ 1500 │высокая│2024-10 │
│ page2/  │ термос 350 мл│  7  │ 890  │ 450  │низкая │2024-10 │
└─────────┴──────────────┴─────┴──────┴──────┴──────┴────────┘
```

---

## 🔐 Безопасность

### API Key Protection
- ✅ API ключ передается только в header запросов
- ✅ Не сохраняется в localStorage/cookies
- ✅ Используется только на сервере (API Route)

### Rate Limiting
- ⏱️ 1 секунда между запросами страниц
- ⏱️ 5 секунд при статусе 202 (данные обрабатываются)
- 🛡️ Защита от блокировки Keys.so API

### Error Handling
- ❌ API недоступен → Показать ошибку, продолжить обработку
- ❌ Неверный API ключ → Остановить обработку
- ❌ URL не найден → Добавить строку с ошибкой в результаты

---

## 📊 Формат данных

### KeywordResult (TypeScript Interface)
```typescript
interface KeywordResult {
  url: string;              // https://example.com/page/
  keyword: string;          // "термос 1 литр"
  position: number;         // 5
  frequency: number;        // 1200 (ws)
  exactFrequency: number;   // 800 (wsk)
  competition: string;      // "средняя"
  date: string;             // "2024-10-31"
}
```

### SSE Message Types
```typescript
// Статус обработки URL
{
  type: 'status',
  url: string,
  data: {
    status: 'pending' | 'processing' | 'completed' | 'error',
    progress: number,          // 0-100
    keywordsFound: number,
    error?: string
  }
}

// Результаты для URL
{
  type: 'result',
  data: KeywordResult[]
}

// Завершение обработки всех URL
{
  type: 'complete',
  totalKeywords: number,
  totalUrls: number
}

// Глобальная ошибка
{
  type: 'error',
  message: string
}
```

---

## ⚡ Оптимизации

### Performance
- 🚀 SSE для потоковой передачи данных (real-time updates)
- 📦 Пагинация API (100 результатов за запрос)
- 🎯 Фильтрация на уровне API (уменьшение объема данных)

### User Experience
- 📊 Прогресс-бары с процентами и счетчиками
- 🎨 Цветовая индикация позиций (зеленый/желтый/серый)
- 💾 Экспорт в CSV с BOM для корректной кодировки в Excel

### Code Quality
- 📝 TypeScript для type safety
- 🧩 Разделение UI и API логики
- 🛡️ Обработка всех edge cases

---

## 🧪 Точки расширения

### Возможные улучшения:
1. **Кеширование результатов** (localStorage/IndexedDB)
2. **Сохранение истории запросов**
3. **Экспорт в XLSX/Google Sheets**
4. **Фильтрация результатов в таблице**
5. **Сортировка по колонкам**
6. **Группировка по URL**
7. **Графики трендов позиций**

---

## 📚 Зависимости

### Frontend:
- React 18+ (из Next.js)
- Next.js 14
- TypeScript
- Tailwind CSS

### Backend:
- Next.js API Routes
- Native Fetch API
- Server-Sent Events (SSE)

### External:
- Keys.so API (https://api.keys.so)

---

**Архитектура готова к масштабированию! 🚀**
