# 🎯 Price Comparator - Технический стек и архитектура

## Обзор

**Price Comparator** - это AI-powered инструмент для автоматического анализа и сравнения цен на услуги с конкурентами. Использует современный стек технологий для парсинга HTML, интеллектуального извлечения данных и точного сопоставления услуг.

---

## 🏗 Архитектура системы

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Next.js App Router + React 19                        │  │
│  │  - Input форма (URL ваших страниц + конкурентов)     │  │
│  │  - Real-time прогресс через SSE                      │  │
│  │  - Таблица результатов с сравнением цен             │  │
│  │  - Экспорт в CSV                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    HTTP POST /api/price-comparator
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API BACKEND                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Next.js API Route (route.ts)                        │  │
│  │  - Server-Sent Events (SSE) streaming                │  │
│  │  - Orchestration pipeline                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Step 1       │  │ Step 2       │  │ Step 3          │  │
│  │ Fetch HTML   │→ │ Clean HTML   │→ │ AI Extraction   │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│         ↓                 ↓                    ↓            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Cheerio                          │   │
│  │  - Remove scripts, styles, images                  │   │
│  │  - Extract text content                            │   │
│  │  - Clean whitespace                                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    OpenAI API (GPT-4o)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      AI PROCESSING                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Phase 1: Price Extraction (для каждого сайта)       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Промпт:                                         │ │  │
│  │  │ - Найти ВСЕ цены на странице                   │ │  │
│  │  │ - Извлечь из таблиц, списков, JSON-LD, текста  │ │  │
│  │  │ - Сохранить точные названия услуг              │ │  │
│  │  │ - Обработать диапазоны и параметры             │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │  ↓                                                    │  │
│  │  Output: [{ service, price }, ...]                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Phase 2: Service Matching                           │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Промпт:                                         │ │  │
│  │  │ - Сопоставить ТОЛЬКО идентичные услуги         │ │  │
│  │  │ - Учитывать параметры (площадь, время и т.д.)  │ │  │
│  │  │ - Быть консервативным (лучше пусто)            │ │  │
│  │  │ - 2-комн ≠ 3-комн (не сопоставлять!)           │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │  ↓                                                    │  │
│  │  Output: Comparison table                            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
                       SSE Stream Results
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  - Update прогресса в реальном времени                      │
│  - Отображение результатов в таблице                        │
│  - Экспорт в CSV                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Технологический стек

### Frontend Layer

#### **Next.js 16**
- **App Router** - Новая архитектура маршрутизации
- **React Server Components** - Оптимизация производительности
- **Client Components** - Интерактивные элементы UI

#### **React 19**
- **Hooks** - useState, useEffect для управления состоянием
- **Streaming** - Обработка SSE потока
- **TypeScript** - Полная типизация

#### **Tailwind CSS 4**
- **Utility-first** - Быстрая стилизация
- **Responsive design** - Адаптивность
- **Custom градиенты** - Современный UI

#### **Lucide React**
- **Icons** - Loader2, Plus, X, BarChart3, AlertCircle
- **SVG-based** - Масштабируемость
- **Легковесность** - Оптимизация bundle size

---

### Backend Layer

#### **Next.js API Routes**
- **Edge-compatible** - Быстрые ответы
- **Serverless-ready** - Легкое деплоймент
- **TypeScript-first** - Типизация из коробки

#### **Server-Sent Events (SSE)**
```typescript
Content-Type: text/event-stream
Connection: keep-alive

data: {"type": "progress", "message": "Загружаем HTML..."}
data: {"type": "result", "data": {...}}
```

**Преимущества SSE:**
- ✅ Односторонний поток (сервер → клиент)
- ✅ Автоматический reconnect
- ✅ Простота реализации vs WebSocket
- ✅ Совместимость с HTTP/2

#### **Cheerio**
```typescript
const $ = cheerio.load(html);
$('script, style, noscript, iframe, img, svg').remove();
const text = $('body').text();
```

**Возможности:**
- jQuery-like API
- Быстрый парсинг HTML
- DOM manipulation
- Селекторы CSS

**Альтернативы:**
- JSDOM (тяжелее, полный DOM)
- Puppeteer (для JavaScript-rendered)
- Playwright (для сложных сайтов)

---

### AI Layer

#### **OpenAI GPT-4o**

**Модель:** `gpt-4o`  
**Release:** May 2024  
**Context:** 128K tokens  
**Преимущества:**
- Отличное понимание русского языка
- JSON mode для structured outputs
- Высокая точность извлечения данных
- Разумная стоимость ($2.50/$10.00 per 1M tokens)

**Конфигурация:**
```typescript
{
  model: 'gpt-4o',
  temperature: 0.1,           // Низкая для точности
  response_format: { 
    type: 'json_object'       // Structured outputs
  }
}
```

**Альтернативные модели:**

| Модель | Стоимость | Точность | Скорость | Рекомендация |
|--------|-----------|----------|----------|--------------|
| GPT-4o | $$ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Основная |
| GPT-4 Turbo | $$$ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Для сложных кейсов |
| GPT-3.5 Turbo | $ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Экономия бюджета |
| Claude 3 Opus | $$$ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Альтернатива GPT-4 |
| Claude 3 Sonnet | $$ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Баланс цена/качество |
| Gemini Pro | $ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Google экосистема |

---

## 🔄 Data Flow Pipeline

### Phase 1: Input Collection

```typescript
interface RequestBody {
  ourServiceUrl: string;      // "https://mysite.com/services"
  ourPriceUrl: string;        // "https://mysite.com/prices"
  competitors: Array<{
    id: string;               // "1"
    url: string;              // "https://competitor.com/prices"
    name?: string;            // "Competitor A"
  }>;
  apiKey: string;             // "sk-..."
}
```

---

### Phase 2: HTML Fetching

```typescript
async function fetchHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  return await response.text();
}
```

**Параллельная загрузка:**
```typescript
const [ourServiceHTML, ourPriceHTML] = await Promise.all([
  fetchHTML(ourServiceUrl),
  fetchHTML(ourPriceUrl)
]);
```

**Обработка ошибок:**
- Network timeouts
- 404/500 errors
- Blocked requests (403)
- CORS issues (for client-side)

---

### Phase 3: HTML Cleaning

```typescript
function cleanHTML(html: string): string {
  const $ = cheerio.load(html);
  
  // Удаление ненужных элементов
  $('script, style, noscript, iframe, img, svg').remove();
  
  // Извлечение текста
  const text = $('body').text();
  
  // Очистка whitespace
  return text.replace(/\s+/g, ' ').trim();
}
```

**Что удаляется:**
- `<script>` - JavaScript код
- `<style>` - CSS стили
- `<noscript>` - Fallback контент
- `<iframe>` - Встроенные фреймы
- `<img>`, `<svg>` - Изображения

**Что остается:**
- Текстовый контент
- Структура HTML (для понимания контекста)
- Таблицы (важно для цен!)
- Списки (часто содержат прайсы)

---

### Phase 4: AI Price Extraction

**Input:**
```
Текст страницы: "Уборка 2-комнатной квартиры ... цена 4000 рублей"
```

**Промпт:**
```
Проанализируй текст и извлеки ВСЕ цены.
Найди в таблицах, списках, JSON-LD, тексте.
Верни JSON: [{ service, price }, ...]
```

**Output:**
```json
[
  {
    "service": "Уборка 2-комнатной квартиры",
    "price": "4000 рублей"
  }
]
```

**Типы цен, которые AI распознает:**
- `3500 руб.`
- `от 3000 до 5000 рублей`
- `$50 per hour`
- `3 500 ₽`
- `Price: 3,500 RUB`
- `три тысячи рублей` (текстом)

---

### Phase 5: Service Matching

**Input:**
```json
{
  "ourServices": [
    { "service": "Уборка 2-комнатной", "price": "4000 руб." }
  ],
  "competitors": {
    "Comp1": [
      { "service": "Клининг двухкомнатной квартиры", "price": "3500 руб." }
    ],
    "Comp2": [
      { "service": "Уборка 3-комнатной", "price": "5500 руб." }
    ]
  }
}
```

**AI Matching Logic:**

```
✅ СОПОСТАВИТЬ:
- "Уборка 2-комн" ↔ "Клининг двухкомнатной"
  (разные слова, одна услуга)

❌ НЕ СОПОСТАВЛЯТЬ:
- "Уборка 2-комн" ⛔ "Уборка 3-комн"
  (разные параметры)
```

**Output:**
```json
{
  "comparison": [
    {
      "service": "Уборка 2-комнатной",
      "ourPrice": "4000 руб.",
      "competitorPrices": {
        "Comp1": "3500 руб.",
        "Comp2": ""
      }
    }
  ]
}
```

---

## 🎨 UI/UX Design

### Component Structure

```
<PriceComparator>
  ├── <Header> - Заголовок и описание
  ├── <ApiKeySection> - Ввод OpenAI ключа
  ├── <OurSiteSection>
  │   ├── <Input> - URL страницы с услугами
  │   └── <Input> - URL страницы с ценами
  ├── <CompetitorsSection>
  │   └── <CompetitorInput>[] - Динамический список
  ├── <AnalyzeButton> - Запуск анализа
  ├── <ProgressSection> - Real-time статус
  ├── <ErrorSection> - Отображение ошибок
  └── <ResultsSection>
      ├── <ComparisonTable> - Таблица с результатами
      └── <ExportButton> - CSV экспорт
```

### Design Principles

1. **Progressive Disclosure**
   - Сначала основные поля
   - Дополнительные конкуренты по клику

2. **Real-time Feedback**
   - SSE прогресс
   - Loader индикаторы
   - Error messages inline

3. **Responsive Design**
   - Mobile-first approach
   - Таблица со scrollbar на мобильных
   - Touch-friendly buttons

4. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation

---

## 📊 Data Models

### TypeScript Interfaces

```typescript
interface CompetitorUrl {
  id: string;
  url: string;
  name?: string;
}

interface ServicePrice {
  service: string;
  price: string;
}

interface ComparisonRow {
  service: string;
  ourPrice: string;
  competitorPrices: Record<string, string>;
}

interface AnalysisResult {
  ourServices: ServicePrice[];
  competitors: Record<string, ServicePrice[]>;
  comparison: ComparisonRow[];
}

interface SSEMessage {
  type: 'progress' | 'result' | 'error';
  message?: string;
  data?: AnalysisResult;
}
```

---

## 🔒 Security

### API Key Handling

```typescript
// ✅ ХОРОШО: Ключ в запросе, не сохраняется
const apiKey = request.body.apiKey;
// Используется только в рамках одного запроса

// ❌ ПЛОХО: Ключ в .env (если публичный доступ)
const apiKey = process.env.OPENAI_API_KEY;
```

### Input Validation

```typescript
// Валидация URL
if (!ourServiceUrl || !ourPriceUrl) {
  return { error: 'Missing URLs' };
}

// Валидация API ключа
if (!apiKey || !apiKey.startsWith('sk-')) {
  return { error: 'Invalid API key' };
}

// Лимит на количество конкурентов
if (competitors.length > 20) {
  return { error: 'Too many competitors (max 20)' };
}
```

### Rate Limiting

```typescript
// Опционально: добавить rate limiting
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 минута
  uniqueTokenPerInterval: 500,
});

await limiter.check(10, 'CACHE_TOKEN'); // 10 req/min
```

---

## 📈 Performance Optimization

### 1. Параллельная обработка

```typescript
// ❌ Последовательная (медленно)
for (const url of urls) {
  const html = await fetchHTML(url);
}

// ✅ Параллельная (быстро)
const htmls = await Promise.all(
  urls.map(url => fetchHTML(url))
);
```

### 2. Кэширование

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 });

function fetchHTMLCached(url: string) {
  const cached = cache.get(url);
  if (cached) return cached;
  
  const html = await fetchHTML(url);
  cache.set(url, html);
  return html;
}
```

### 3. Streaming Results

```typescript
// Отправка результатов по мере готовности
for (const competitor of competitors) {
  const prices = await extractPrices(competitor);
  
  sendProgress({
    type: 'partial_result',
    data: prices
  });
}
```

### 4. HTML Truncation

```typescript
// Ограничение размера для экономии tokens
const maxChars = 30000;
const truncated = text.length > maxChars 
  ? text.substring(0, maxChars) + '...'
  : text;
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// HTML cleaning
test('cleanHTML removes scripts', () => {
  const html = '<html><script>alert("XSS")</script><body>Content</body></html>';
  const clean = cleanHTML(html);
  expect(clean).not.toContain('script');
  expect(clean).toContain('Content');
});

// Price parsing
test('parsePrice extracts number', () => {
  expect(parsePrice('3500 руб.')).toBe(3500);
  expect(parsePrice('от 3000 до 5000')).toBe(3000);
});
```

### Integration Tests

```typescript
// Full pipeline
test('analyzes prices end-to-end', async () => {
  const result = await analyzePrices({
    ourServiceUrl: 'https://example.com/services',
    ourPriceUrl: 'https://example.com/prices',
    competitors: [{ url: 'https://comp.com/prices' }],
    apiKey: 'test-key'
  });
  
  expect(result.comparison).toBeDefined();
  expect(result.comparison.length).toBeGreaterThan(0);
});
```

### E2E Tests (Playwright)

```typescript
test('user can analyze prices', async ({ page }) => {
  await page.goto('http://localhost:3000/price-comparator');
  
  // Fill form
  await page.fill('input[placeholder*="API"]', 'sk-test-key');
  await page.fill('input[placeholder*="services"]', 'https://example.com');
  
  // Submit
  await page.click('button:has-text("Начать анализ")');
  
  // Wait for results
  await page.waitForSelector('table', { timeout: 60000 });
  
  // Check results
  const rows = await page.$$('table tbody tr');
  expect(rows.length).toBeGreaterThan(0);
});
```

---

## 🚀 Deployment

### Vercel (Рекомендуется)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Конфигурация** (`vercel.json`):
```json
{
  "functions": {
    "app/api/price-comparator/route.ts": {
      "maxDuration": 300
    }
  }
}
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables

```bash
# Production
OPENAI_API_KEY=sk-prod-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

---

## 📊 Monitoring & Analytics

### Logging

```typescript
import { logger } from '@/lib/logger';

logger.info('Price analysis started', {
  competitorCount: competitors.length,
  timestamp: new Date()
});

logger.error('Failed to fetch HTML', {
  url,
  error: error.message
});
```

### Metrics

```typescript
// Track performance
const startTime = Date.now();

// ... processing ...

const duration = Date.now() - startTime;
await recordMetric('price_analysis_duration', duration);
await recordMetric('services_found', result.comparison.length);
```

### Error Tracking (Sentry)

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // ... processing ...
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'price-comparator',
      url: ourServiceUrl
    }
  });
}
```

---

## 💰 Cost Analysis

### OpenAI API Costs (GPT-4o)

**Прайсинг:**
- Input: $2.50 / 1M tokens
- Output: $10.00 / 1M tokens

**Средний анализ:**
- Input: ~10,000 tokens (HTML текст + промпты)
- Output: ~1,000 tokens (JSON результаты)
- **Стоимость:** ~$0.015 per website

**Полный анализ (6 сайтов):**
- Ваш сайт: 2 страницы = $0.03
- 5 конкурентов: 5 × $0.015 = $0.075
- Сопоставление: $0.015
- **Итого:** ~$0.12 per analysis

**Месячная стоимость:**
- Ежедневный анализ: $0.12 × 30 = $3.60/month
- Еженедельный: $0.12 × 4 = $0.48/month

---

## 🔮 Future Enhancements

### Краткосрочные (1-2 месяца)

1. **Puppeteer integration**
   - Поддержка JavaScript-rendered сайтов
   - Screenshot для визуального анализа

2. **История анализов**
   - Database (PostgreSQL/MongoDB)
   - Просмотр прошлых результатов
   - Графики изменений цен

3. **Batch обработка**
   - Анализ 20+ конкурентов за раз
   - Queue система

4. **Excel export**
   - Форматирование
   - Графики в Excel
   - Conditional formatting

### Среднесрочные (3-6 месяцев)

5. **Автоматический мониторинг**
   - Cron jobs
   - Email уведомления
   - Webhook интеграции

6. **Multi-LLM support**
   - Claude 3
   - Gemini Pro
   - Выбор модели в UI

7. **Advanced matching**
   - Fuzzy matching для названий
   - ML-based сопоставление
   - Confidence scores

8. **API endpoints**
   - REST API
   - Authentication
   - Rate limiting

### Долгосрочные (6+ месяцев)

9. **Collaborative features**
   - Multi-user accounts
   - Team workspaces
   - Comments and notes

10. **Analytics dashboard**
    - Price trends over time
    - Market positioning
    - Competitor insights

11. **Mobile app**
    - React Native
    - Push notifications
    - Offline mode

12. **AI recommendations**
    - Pricing suggestions
    - Market analysis
    - Competitive strategy

---

## 📚 Дополнительные ресурсы

### Документация
- [Next.js Docs](https://nextjs.org/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Cheerio Documentation](https://cheerio.js.org/)
- [Server-Sent Events Spec](https://html.spec.whatwg.org/multipage/server-sent-events.html)

### Связанные проекты
- [Puppeteer](https://pptr.dev/) - Headless Chrome
- [Playwright](https://playwright.dev/) - Browser automation
- [LangChain](https://js.langchain.com/) - LLM framework
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI utilities

---

**Версия документа:** 1.0.0  
**Последнее обновление:** Декабрь 2025  
**Автор:** Игорь Бурдуков



