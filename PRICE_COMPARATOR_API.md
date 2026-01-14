# 🔌 Price Comparator API Documentation

## Endpoints

### POST `/api/price-comparator`

Запускает процесс анализа цен конкурентов.

**Content-Type:** `application/json`

**Response-Type:** `text/event-stream` (Server-Sent Events)

---

## Request Body

```typescript
interface RequestBody {
  ourServiceUrl: string;      // URL страницы с описанием ваших услуг
  ourPriceUrl: string;        // URL страницы с вашими ценами
  competitors: Array<{
    id: string;               // Уникальный ID (можно использовать Date.now())
    url: string;              // URL страницы конкурента
    name?: string;            // Опциональное название конкурента
  }>;
  apiKey: string;             // OpenAI API ключ
}
```

### Пример запроса

```javascript
const response = await fetch('/api/price-comparator', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    ourServiceUrl: 'https://mysite.com/services',
    ourPriceUrl: 'https://mysite.com/prices',
    competitors: [
      {
        id: '1',
        url: 'https://competitor1.com/prices',
        name: 'Competitor 1'
      },
      {
        id: '2',
        url: 'https://competitor2.com/prices-page1',
        name: 'Competitor 2'
      },
      {
        id: '3',
        url: 'https://competitor2.com/prices-page2',
        name: 'Competitor 2'  // Тот же конкурент, другая страница
      }
    ],
    apiKey: 'sk-...'
  })
});
```

---

## Response (SSE Stream)

Сервер отправляет события в формате Server-Sent Events:

```
data: {"type": "progress", "message": "Загружаем HTML страниц..."}

data: {"type": "progress", "message": "Анализируем ваш сайт..."}

data: {"type": "progress", "message": "Анализируем конкурента 1/3..."}

data: {"type": "result", "data": {...}}
```

### Event Types

#### 1. Progress Event

```typescript
{
  type: 'progress',
  message: string  // Текущий статус обработки
}
```

**Примеры сообщений:**
- "Загружаем HTML страниц..."
- "Очищаем HTML от лишних элементов..."
- "Анализируем ваш сайт с помощью AI..."
- "Анализируем конкурента 1/3: Competitor 1..."
- "Сопоставляем услуги и создаем сводную таблицу..."

#### 2. Result Event

```typescript
{
  type: 'result',
  data: {
    ourServices: Array<{
      service: string;  // Название услуги
      price: string;    // Цена с валютой
    }>;
    competitors: Record<string, Array<{
      service: string;
      price: string;
    }>>;
    comparison: Array<{
      service: string;              // Название услуги (из нашего списка)
      ourPrice: string;             // Наша цена
      competitorPrices: Record<string, string>;  // Цены конкурентов
    }>;
  }
}
```

#### 3. Error Event

```typescript
{
  type: 'error',
  message: string  // Описание ошибки
}
```

---

## Response Data Structure

### Полная структура результата

```typescript
interface AnalysisResult {
  // Наши услуги и цены (извлеченные из HTML)
  ourServices: ServicePrice[];
  
  // Услуги и цены каждого конкурента
  competitors: Record<string, ServicePrice[]>;
  
  // Сводная таблица сравнения
  comparison: ComparisonRow[];
}

interface ServicePrice {
  service: string;  // "Уборка 2-комнатной квартиры"
  price: string;    // "от 3500 до 5000 руб."
}

interface ComparisonRow {
  service: string;                      // Название нашей услуги
  ourPrice: string;                     // Наша цена
  competitorPrices: Record<string, string>;  // { "Competitor 1": "3500 руб.", ... }
}
```

### Пример результата

```json
{
  "ourServices": [
    {
      "service": "Уборка 2-комнатной квартиры",
      "price": "4000 руб."
    },
    {
      "service": "Уборка 3-комнатной квартиры",
      "price": "5500 руб."
    }
  ],
  "competitors": {
    "Competitor 1": [
      {
        "service": "Уборка двухкомнатной квартиры",
        "price": "3500 рублей"
      },
      {
        "service": "Уборка трехкомнатной квартиры",
        "price": "5000 рублей"
      }
    ],
    "Competitor 2": [
      {
        "service": "Клининг 2к квартиры",
        "price": "от 4500 до 6000 руб."
      }
    ]
  },
  "comparison": [
    {
      "service": "Уборка 2-комнатной квартиры",
      "ourPrice": "4000 руб.",
      "competitorPrices": {
        "Competitor 1": "3500 рублей",
        "Competitor 2": ""
      }
    },
    {
      "service": "Уборка 3-комнатной квартиры",
      "ourPrice": "5500 руб.",
      "competitorPrices": {
        "Competitor 1": "5000 рублей",
        "Competitor 2": ""
      }
    }
  ]
}
```

---

## Обработка SSE на клиенте

### Базовый пример

```javascript
const response = await fetch('/api/price-comparator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestData)
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      
      if (data.type === 'progress') {
        console.log('Progress:', data.message);
      } else if (data.type === 'result') {
        console.log('Result:', data.data);
      } else if (data.type === 'error') {
        console.error('Error:', data.message);
      }
    }
  }
}
```

### Пример с React hooks

```typescript
const [progress, setProgress] = useState('');
const [result, setResult] = useState(null);
const [error, setError] = useState(null);

const handleAnalyze = async () => {
  try {
    const response = await fetch('/api/price-comparator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          switch (data.type) {
            case 'progress':
              setProgress(data.message);
              break;
            case 'result':
              setResult(data.data);
              break;
            case 'error':
              setError(data.message);
              break;
          }
        }
      }
    }
  } catch (err) {
    setError(err.message);
  }
};
```

---

## Внутренние функции API

### 1. `fetchHTML(url: string): Promise<string>`

Загружает HTML страницы с User-Agent для обхода базовых блокировок.

```typescript
const fetchHTML = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  return await response.text();
};
```

### 2. `cleanHTML(html: string): string`

Очищает HTML от ненужных элементов, оставляет только текст.

```typescript
const cleanHTML = (html: string): string => {
  const $ = cheerio.load(html);
  $('script, style, noscript, iframe, img, svg').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
};
```

### 3. `extractPrices(text: string, apiKey: string): Promise<ServicePrice[]>`

Использует GPT-4 для извлечения цен из текста.

**Модель:** `gpt-4o`  
**Temperature:** `0.1` (низкая для точности)  
**Response format:** `json_object` (structured output)

**Промпт включает:**
- Инструкции по поиску цен во всех форматах
- Требование сохранять точные названия услуг
- Обработка диапазонов цен
- Извлечение из таблиц, списков, JSON-LD

### 4. `matchServices(ourServices, competitorPrices, apiKey): Promise<ComparisonRow[]>`

Сопоставляет услуги между сайтами.

**Модель:** `gpt-4o`  
**Temperature:** `0.1`  
**Response format:** `json_object`

**Критические требования:**
- Сопоставлять ТОЛЬКО идентичные услуги
- Учитывать все параметры (площадь, время и т.д.)
- Консервативный подход (лучше пусто, чем неправильно)

---

## Error Handling

### Типы ошибок

#### 1. Network Errors

```json
{
  "type": "error",
  "message": "Failed to fetch https://example.com: 404"
}
```

**Причины:**
- URL недоступен
- Сайт блокирует запросы
- Таймаут подключения

#### 2. OpenAI API Errors

```json
{
  "type": "error",
  "message": "OpenAI API error: Insufficient quota"
}
```

**Причины:**
- Неверный API ключ
- Недостаточно средств на аккаунте
- Превышен rate limit
- Проблемы с OpenAI сервисом

#### 3. Parsing Errors

```json
{
  "type": "error",
  "message": "Failed to parse JSON response from OpenAI"
}
```

**Причины:**
- OpenAI вернул невалидный JSON
- Модель не следовала инструкциям

---

## Rate Limits & Costs

### OpenAI API Limits

**GPT-4o (по состоянию на декабрь 2024):**
- **Input:** $2.50 / 1M tokens
- **Output:** $10.00 / 1M tokens
- **Rate limit:** 10,000 requests/min (платный аккаунт)

### Примерные затраты

**Один конкурент:**
- Извлечение цен: ~5,000 input tokens, ~500 output tokens
- Стоимость: ~$0.015

**Сопоставление (финальный этап):**
- Input: ~2,000 tokens
- Output: ~1,000 tokens
- Стоимость: ~$0.015

**Полный анализ (ваш сайт + 5 конкурентов):**
- Общая стоимость: ~$0.10 - $0.15

### Время обработки

- Загрузка HTML: ~2-5 сек на сайт
- GPT-4 анализ: ~10-30 сек на сайт
- Сопоставление: ~10-20 сек

**Итого для 5 конкурентов:** ~2-3 минуты

---

## Advanced Usage

### Кастомизация промптов

Вы можете изменить промпты в `route.ts` для:

#### Более строгого извлечения цен

```typescript
const prompt = `Извлеки ТОЛЬКО цены из прайс-листа.
Игнорируй примерные цены, цены "от", рекламные предложения.
Возвращай только фиксированные цены.`;
```

#### Более гибкого сопоставления

```typescript
const prompt = `Сопоставь услуги даже если названия немного отличаются.
Считай синонимами: "уборка" = "клининг", "2-комн." = "двухкомнатная".`;
```

### Batch обработка

Если нужно обработать много конкурентов, можно распараллелить:

```typescript
// Параллельное извлечение цен
const results = await Promise.all(
  competitors.map(c => extractPrices(c.text, apiKey, c.name))
);
```

### Кэширование

Для экономии на повторных запросах:

```typescript
// Простое in-memory кэширование
const cache = new Map<string, ServicePrice[]>();

if (cache.has(url)) {
  return cache.get(url);
}

const result = await extractPrices(text, apiKey);
cache.set(url, result);
return result;
```

### Webhook интеграция

Отправка результатов на webhook после завершения:

```typescript
await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    timestamp: new Date().toISOString(),
    result: comparisonData
  })
});
```

---

## Testing

### Unit тест для cleanHTML

```typescript
import { cleanHTML } from '@/app/api/price-comparator/route';

test('removes scripts and styles', () => {
  const html = `
    <html>
      <head><script>alert('test')</script></head>
      <body>
        <h1>Services</h1>
        <style>.test { color: red; }</style>
        <p>Price: 1000 руб.</p>
      </body>
    </html>
  `;
  
  const clean = cleanHTML(html);
  expect(clean).not.toContain('alert');
  expect(clean).not.toContain('.test');
  expect(clean).toContain('Services');
  expect(clean).toContain('1000 руб.');
});
```

### Integration тест

```typescript
test('full pipeline with mock data', async () => {
  const mockResponse = await fetch('/api/price-comparator', {
    method: 'POST',
    body: JSON.stringify({
      ourServiceUrl: 'https://example.com/services',
      ourPriceUrl: 'https://example.com/prices',
      competitors: [{ id: '1', url: 'https://comp.com/prices' }],
      apiKey: 'test-key'
    })
  });
  
  expect(mockResponse.ok).toBe(true);
  expect(mockResponse.headers.get('content-type')).toBe('text/event-stream');
});
```

---

## Security Considerations

### API Key Safety

❌ **НИКОГДА не храните API ключ в коде:**
```typescript
const apiKey = 'sk-...';  // ПЛОХО
```

✅ **Используйте переменные окружения:**
```typescript
const apiKey = process.env.OPENAI_API_KEY;  // ХОРОШО
```

✅ **Или принимайте от клиента (как сейчас):**
```typescript
// Клиент передает ключ в запросе
// Ключ используется только в рамках одного запроса
// Не логируется, не сохраняется
```

### CORS Protection

Если API будет публичным, добавьте CORS:

```typescript
export async function POST(request: NextRequest) {
  // Проверка origin
  const origin = request.headers.get('origin');
  if (!allowedOrigins.includes(origin)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // ... остальной код
}
```

### Rate Limiting

Для защиты от злоупотреблений:

```typescript
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 минута
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    await limiter.check(10, 'CACHE_TOKEN'); // 10 запросов в минуту
  } catch {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  // ... остальной код
}
```

---

## Monitoring & Logging

### Добавление логирования

```typescript
import { logger } from '@/lib/logger';

// В начале обработки
logger.info('Starting price comparison', {
  ourUrl: ourServiceUrl,
  competitorCount: competitors.length
});

// При ошибках
logger.error('Failed to fetch HTML', {
  url,
  error: error.message
});

// При успехе
logger.info('Comparison completed', {
  servicesFound: result.comparison.length,
  duration: Date.now() - startTime
});
```

### Метрики

```typescript
// Отслеживание производительности
const metrics = {
  fetchTime: 0,
  aiProcessingTime: 0,
  matchingTime: 0,
  totalTime: 0
};

// Запись в метрики
await recordMetric('price_comparison_duration', metrics.totalTime);
await recordMetric('services_compared', result.comparison.length);
```

---

## FAQ

### Q: Можно ли использовать другую LLM вместо OpenAI?

**A:** Да, код легко адаптируется под другие API:

```typescript
// Для Claude (Anthropic)
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-3-opus-20240229',
    messages: [{ role: 'user', content: prompt }]
  })
});

// Для Gemini (Google)
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  }
);
```

### Q: Как обработать JavaScript-rendered сайты?

**A:** Используйте headless browser:

```typescript
import puppeteer from 'puppeteer';

const fetchHTML = async (url: string): Promise<string> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  const html = await page.content();
  await browser.close();
  return html;
};
```

### Q: Как сохранять историю анализов?

**A:** Добавьте базу данных:

```typescript
import { db } from '@/lib/database';

// После завершения анализа
await db.priceComparisons.create({
  data: {
    ourUrl: ourServiceUrl,
    competitors: competitors.map(c => c.url),
    result: comparisonData,
    createdAt: new Date()
  }
});
```

---

**Документация актуальна:** Декабрь 2025  
**API Version:** 1.0.0



