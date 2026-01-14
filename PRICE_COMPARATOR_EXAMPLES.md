# 💡 Price Comparator - Примеры использования

## Кейсы применения

### 1. Клининговая компания

**Задача:** Сравнить цены на уборку квартир с 5 конкурентами.

**Входные данные:**
- Ваш сайт: `https://cleanservice.ru/uslugi` + `https://cleanservice.ru/ceny`
- Конкуренты:
  - CleanPro: `https://cleanpro.ru/price`
  - УборкаЛюкс: `https://uborkalux.ru/prajs`
  - КлинингСервис: `https://klining.ru/stoimost/kvartiry`
  - Чистота: `https://chistota.ru/ceny`
  - БлескСервис: `https://blesk.ru/prajs-list`

**Результат:**

| Услуга | Мы | CleanPro | УборкаЛюкс | КлинингСервис | Чистота | БлескСервис |
|--------|-----|----------|------------|---------------|---------|-------------|
| Уборка 1-комн. | 2500₽ | 2300₽ | 2700₽ | 2400₽ | — | 2600₽ |
| Уборка 2-комн. | 3500₽ | 3200₽ | 3800₽ | 3400₽ | 3600₽ | 3500₽ |
| Уборка 3-комн. | 4500₽ | 4100₽ | 4800₽ | 4300₽ | 4600₽ | 4400₽ |
| Генеральная уборка | 5500₽ | 5000₽ | — | 5200₽ | 5800₽ | — |

**Инсайты:**
- Вы конкурентоспособны по 2-комнатным
- Можно снизить цену на 1-комнатные
- Генеральная уборка дороже у Чистоты

---

### 2. IT-аутсорсинг компания

**Задача:** Сравнить почасовые ставки разработчиков с конкурентами.

**Входные данные:**
- Ваш сайт: 
  - `https://itoutsource.com/services`
  - `https://itoutsource.com/pricing`
- Конкуренты:
  - DevTeam: `https://devteam.io/rates` + `https://devteam.io/specialists`
  - CodeFactory: `https://codefactory.com/pricing`

**Особенность:** У DevTeam цены на разных страницах (по типам специалистов).

**Решение:**
```javascript
competitors: [
  { 
    id: '1', 
    url: 'https://devteam.io/rates', 
    name: 'DevTeam' 
  },
  { 
    id: '2', 
    url: 'https://devteam.io/specialists', 
    name: 'DevTeam'  // То же название
  },
  { 
    id: '3', 
    url: 'https://codefactory.com/pricing', 
    name: 'CodeFactory' 
  }
]
```

**Результат:**

| Услуга | Мы | DevTeam | CodeFactory |
|--------|-----|---------|-------------|
| Senior React Developer | $65/час | $60/час | $70/час |
| Middle Python Developer | $45/час | $42/час | $48/час |
| DevOps Engineer | $55/час | $50/час | — |
| QA Automation | $40/час | — | $45/час |

---

### 3. Стоматологическая клиника

**Задача:** Сравнить цены на основные процедуры с клиниками в районе.

**Входные данные:**
- Ваша клиника:
  - `https://dentist-clinic.ru/uslugi`
  - `https://dentist-clinic.ru/ceny`
- Конкуренты:
  - СтомаЛюкс: `https://stomalux.ru/prajs/terapiya` + `https://stomalux.ru/prajs/hirurgiya`
  - ДентаПро: `https://dentapro.ru/stoimost`
  - БелыеЗубы: `https://white-teeth.ru/prices`

**Результат:**

| Услуга | Мы | СтомаЛюкс | ДентаПро | БелыеЗубы |
|--------|-----|-----------|----------|-----------|
| Лечение кариеса | 3500₽ | 3200₽ | 3800₽ | 3400₽ |
| Удаление зуба | 2500₽ | 2800₽ | 2400₽ | 2600₽ |
| Имплантация | 35000₽ | 38000₽ | 32000₽ | 40000₽ |
| Отбеливание | 15000₽ | — | 18000₽ | 14000₽ |

**Анализ:**
- Имплантация - конкурентная цена
- Отбеливание дороже БелыхЗубов на 1000₽
- Удаление зуба - самая низкая цена

---

## Best Practices

### ✅ Правильное использование

#### 1. Точные URL страниц с ценами

```javascript
// Хорошо
ourPriceUrl: 'https://site.com/prices/cleaning-services'

// Плохо
ourPriceUrl: 'https://site.com'  // Главная страница
```

#### 2. Группировка страниц одного конкурента

```javascript
// Если у конкурента цены разбиты по категориям
competitors: [
  { id: '1', url: 'https://comp.com/prices/service-a', name: 'Конкурент' },
  { id: '2', url: 'https://comp.com/prices/service-b', name: 'Конкурент' },
  { id: '3', url: 'https://comp.com/prices/service-c', name: 'Конкурент' }
]
```

#### 3. Краткие названия конкурентов

```javascript
// Хорошо
name: 'CleanPro'

// Плохо (слишком длинно для таблицы)
name: 'ООО "КлинингСервис Профессиональная Уборка Помещений"'
```

#### 4. Проверка доступности страниц

Перед запуском анализа откройте каждый URL в браузере и убедитесь:
- ✅ Страница открывается
- ✅ На странице есть цены
- ✅ Цены не скрыты за JavaScript (калькуляторы)

---

### ❌ Частые ошибки

#### 1. Использование динамических калькуляторов

```
❌ https://competitor.com/calculator
```

**Проблема:** Цены генерируются JavaScript после взаимодействия пользователя.

**Решение:** Найдите страницу со статичным прайс-листом.

#### 2. Страницы за авторизацией

```
❌ https://competitor.com/personal-account/prices
```

**Проблема:** API не может получить доступ.

**Решение:** Используйте публичные страницы.

#### 3. PDF прайс-листы

```
❌ https://competitor.com/price-list.pdf
```

**Проблема:** HTML парсер не работает с PDF.

**Решение:** Найдите HTML версию или конвертируйте PDF в текст отдельно.

#### 4. Слишком общие страницы

```
❌ https://competitor.com/services
```

**Проблема:** Описание услуг без цен.

**Решение:** Найдите конкретную страницу с ценами.

---

## Продвинутые сценарии

### Сценарий 1: Региональные конкуренты

**Задача:** Сравнить цены в разных городах.

```javascript
// Москва
{
  id: '1',
  url: 'https://competitor.com/moscow/prices',
  name: 'Конкурент (Москва)'
}

// Санкт-Петербург
{
  id: '2',
  url: 'https://competitor.com/spb/prices',
  name: 'Конкурент (СПб)'
}
```

**Результат:** Увидите региональные различия в ценах.

---

### Сценарий 2: Мониторинг изменений цен

**Процесс:**
1. Запустите анализ сегодня
2. Экспортируйте результат в CSV
3. Через месяц запустите снова
4. Сравните два CSV файла

**Python скрипт для сравнения:**

```python
import pandas as pd

# Загрузка результатов
old_prices = pd.read_csv('comparison_dec.csv')
new_prices = pd.read_csv('comparison_jan.csv')

# Сравнение
changes = pd.merge(old_prices, new_prices, on='Услуга', suffixes=('_old', '_new'))

# Найти изменения
for col in changes.columns:
    if col.endswith('_old'):
        competitor = col.replace('_old', '')
        new_col = competitor + '_new'
        
        if new_col in changes.columns:
            changes[f'{competitor}_change'] = (
                changes[new_col] - changes[col]
            )

print("Изменения цен:")
print(changes[changes.filter(like='_change').any(axis=1)])
```

---

### Сценарий 3: Массовый анализ

**Задача:** Проанализировать 20+ конкурентов, но API медленный.

**Решение:** Разбить на батчи.

```javascript
const competitors = [/* 20 конкурентов */];
const batchSize = 5;

for (let i = 0; i < competitors.length; i += batchSize) {
  const batch = competitors.slice(i, i + batchSize);
  
  const result = await fetch('/api/price-comparator', {
    method: 'POST',
    body: JSON.stringify({
      ourServiceUrl,
      ourPriceUrl,
      competitors: batch,
      apiKey
    })
  });
  
  // Сохранить результат
  results.push(await processStream(result));
  
  // Пауза между батчами
  await new Promise(resolve => setTimeout(resolve, 60000));
}

// Объединить все результаты
const finalResult = mergeResults(results);
```

---

### Сценарий 4: Автоматизация через cron

**Задача:** Еженедельный автоматический анализ.

**Решение:** Node.js скрипт + cron.

```javascript
// analyze-prices.js
const fetch = require('node-fetch');
const fs = require('fs');

async function analyzeWeekly() {
  const response = await fetch('http://localhost:3000/api/price-comparator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ourServiceUrl: process.env.OUR_SERVICE_URL,
      ourPriceUrl: process.env.OUR_PRICE_URL,
      competitors: JSON.parse(process.env.COMPETITORS),
      apiKey: process.env.OPENAI_API_KEY
    })
  });

  // Обработка SSE...
  const result = await processStream(response);
  
  // Сохранить результат с датой
  const filename = `results_${new Date().toISOString()}.json`;
  fs.writeFileSync(filename, JSON.stringify(result, null, 2));
  
  // Отправить email с результатами
  await sendEmail({
    to: 'manager@company.com',
    subject: 'Недельный анализ цен конкурентов',
    body: formatReport(result),
    attachments: [filename]
  });
}

analyzeWeekly().catch(console.error);
```

**Crontab (каждый понедельник в 9:00):**

```bash
0 9 * * 1 cd /path/to/project && node analyze-prices.js
```

---

## Интеграции

### Интеграция с Google Sheets

```javascript
import { GoogleSpreadsheet } from 'google-spreadsheet';

async function exportToGoogleSheets(result) {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  });

  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  // Очистить старые данные
  await sheet.clear();

  // Заголовки
  const headers = ['Услуга', 'Наша цена', ...Object.keys(result.competitors)];
  await sheet.setHeaderRow(headers);

  // Данные
  const rows = result.comparison.map(row => ({
    'Услуга': row.service,
    'Наша цена': row.ourPrice,
    ...row.competitorPrices
  }));

  await sheet.addRows(rows);
}
```

---

### Интеграция с Slack

```javascript
async function notifySlack(result) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  
  // Найти где мы дороже конкурентов
  const expensiveServices = result.comparison.filter(row => {
    const ourPrice = parsePrice(row.ourPrice);
    const competitorPrices = Object.values(row.competitorPrices)
      .filter(p => p)
      .map(parsePrice);
    
    return competitorPrices.some(cp => cp < ourPrice);
  });

  const message = {
    text: '📊 Результаты анализа цен',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Проанализировано конкурентов:* ${Object.keys(result.competitors).length}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Услуг дороже конкурентов:* ${expensiveServices.length}`
        }
      },
      {
        type: 'divider'
      },
      ...expensiveServices.slice(0, 5).map(service => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⚠️ *${service.service}*\nМы: ${service.ourPrice}\nКонкуренты: ${Object.entries(service.competitorPrices).filter(([,p]) => p).map(([name,p]) => `${name}: ${p}`).join(', ')}`
        }
      }))
    ]
  };

  await fetch(webhook, {
    method: 'POST',
    body: JSON.stringify(message)
  });
}

function parsePrice(priceStr) {
  // Извлечь число из строки "3500 руб."
  const match = priceStr.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}
```

---

### Интеграция с Notion

```javascript
import { Client } from '@notionhq/client';

async function exportToNotion(result) {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  
  const databaseId = process.env.NOTION_DATABASE_ID;
  
  // Создать страницу с результатами
  const page = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: `Анализ цен ${new Date().toLocaleDateString('ru')}`
            }
          }
        ]
      },
      'Конкурентов': {
        number: Object.keys(result.competitors).length
      },
      'Услуг': {
        number: result.comparison.length
      }
    }
  });

  // Добавить таблицу с результатами
  await notion.blocks.children.append({
    block_id: page.id,
    children: [
      {
        object: 'block',
        type: 'table',
        table: {
          table_width: 2 + Object.keys(result.competitors).length,
          has_column_header: true,
          children: [
            // Заголовки
            {
              type: 'table_row',
              table_row: {
                cells: [
                  [{ type: 'text', text: { content: 'Услуга' } }],
                  [{ type: 'text', text: { content: 'Наша цена' } }],
                  ...Object.keys(result.competitors).map(name => 
                    [{ type: 'text', text: { content: name } }]
                  )
                ]
              }
            },
            // Данные
            ...result.comparison.map(row => ({
              type: 'table_row',
              table_row: {
                cells: [
                  [{ type: 'text', text: { content: row.service } }],
                  [{ type: 'text', text: { content: row.ourPrice } }],
                  ...Object.keys(result.competitors).map(name => 
                    [{ type: 'text', text: { content: row.competitorPrices[name] || '—' } }]
                  )
                ]
              }
            }))
          ]
        }
      }
    ]
  });
}
```

---

## Troubleshooting Guide

### Проблема: "Не удалось извлечь цены"

**Признаки:** В результате пустые таблицы или только часть услуг.

**Возможные причины:**

1. **Цены в изображениях**
   ```
   Решение: Конвертировать изображения в текст с OCR
   ```

2. **Нестандартный формат цен**
   ```
   Пример: "три тысячи рублей" вместо "3000 руб."
   Решение: Добавить в промпт обработку текстовых чисел
   ```

3. **Цены в JavaScript переменных**
   ```html
   <script>
     const prices = { service1: 3000, service2: 4000 };
   </script>
   ```
   ```
   Решение: Добавить парсинг <script> тегов в cleanHTML
   ```

4. **Очень длинный текст (> 30000 символов)**
   ```
   Решение: Увеличить maxChars или улучшить очистку HTML
   ```

---

### Проблема: "Услуги не сопоставились"

**Признаки:** В comparison много пустых ячеек.

**Возможные причины:**

1. **Разные названия услуг**
   ```
   Наш сайт: "Уборка двухкомнатной квартиры"
   Конкурент: "Клининг 2к"
   
   Решение: Добавить в промпт сопоставления синонимов
   ```

2. **Разные параметры**
   ```
   Наш сайт: "Уборка до 50 м²"
   Конкурент: "Уборка до 70 м²"
   
   Это правильно - услуги разные, не должны сопоставляться
   ```

3. **Слишком строгое сопоставление**
   ```
   Решение: Изменить temperature в matchServices с 0.1 на 0.3
   ```

---

### Проблема: "OpenAI API timeout"

**Признаки:** Ошибка после долгого ожидания.

**Решения:**

1. **Добавить timeout в fetch**
   ```javascript
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 120000); // 2 мин
   
   const response = await fetch(url, {
     signal: controller.signal
   });
   ```

2. **Retry механизм**
   ```javascript
   async function fetchWithRetry(fn, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await fn();
       } catch (err) {
         if (i === retries - 1) throw err;
         await new Promise(r => setTimeout(r, 1000 * (i + 1)));
       }
     }
   }
   ```

---

## Performance Optimization

### 1. Кэширование HTML

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 час

async function fetchHTMLCached(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached) return cached as string;
  
  const html = await fetchHTML(url);
  cache.set(url, html);
  return html;
}
```

### 2. Параллельная обработка

```typescript
// Вместо последовательной обработки
for (const competitor of competitors) {
  const prices = await extractPrices(competitor);
}

// Используйте параллельную
const prices = await Promise.all(
  competitors.map(c => extractPrices(c))
);
```

### 3. Streaming больших результатов

```typescript
// Отправлять результаты по мере готовности
for (const competitor of competitors) {
  const prices = await extractPrices(competitor);
  
  // Сразу отправляем клиенту
  sendProgress({
    type: 'partial_result',
    competitor: competitor.name,
    prices
  });
}
```

---

## Заключение

Price Comparator - мощный инструмент для конкурентного анализа. Используйте эти примеры и best practices для максимальной эффективности!

**Помните:**
- ✅ Точные URL с ценами
- ✅ Проверка доступности страниц
- ✅ Краткие названия конкурентов
- ✅ Регулярный мониторинг изменений

**Нужна помощь?** Telegram: @iganiga1



