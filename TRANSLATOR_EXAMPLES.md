# 📚 AI Переводчик — Примеры использования

## 🎯 Базовое использование

### 1. Через UI (самый простой способ)

1. Откройте http://localhost:3000/translator
2. Выберите языки (например, English → Russian)
3. Вставьте текст
4. Нажмите "Перевести"
5. Скопируйте результат

---

## 🔌 Через API

### Простой запрос (fetch)

```typescript
const response = await fetch('/api/translator', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Hello! How are you?',
    fromLang: 'English',
    toLang: 'Russian'
  })
});

const data = await response.json();
console.log(data.result); // "Привет! Как дела?"
```

### С обработкой ошибок

```typescript
async function translateText(text: string) {
  try {
    const response = await fetch('/api/translator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        fromLang: 'English',
        toLang: 'Russian',
        maxParallel: 5
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Translation failed');
    }

    return {
      text: data.result,
      stats: data.stats
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// Использование
const result = await translateText('Hello world!');
console.log(result.text);
console.log(`Processed in ${result.stats.processingTime}ms`);
```

### Axios

```typescript
import axios from 'axios';

const translateWithAxios = async (text: string) => {
  const { data } = await axios.post('/api/translator', {
    text,
    fromLang: 'English',
    toLang: 'Russian'
  });

  return data;
};

// Использование
const result = await translateWithAxios('Hello!');
console.log(result.result);
```

---

## 📝 Примеры текстов

### Короткий текст

```typescript
const shortText = `
Hello! This is a test translation.
The weather is nice today.
`;

const result = await fetch('/api/translator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: shortText,
    fromLang: 'English',
    toLang: 'Russian'
  })
}).then(r => r.json());

// Результат:
// "Привет! Это тестовый перевод.
//  Погода сегодня хорошая."
```

### Средний текст

```typescript
const mediumText = `
# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on 
developing systems that can learn and improve from experience without 
being explicitly programmed.

## Key Concepts

1. Supervised Learning: Learning from labeled data
2. Unsupervised Learning: Finding patterns in unlabeled data
3. Reinforcement Learning: Learning through trial and error
`;

const result = await translateText(mediumText);
console.log(result.stats.chunksCount); // 1-2 chunks
```

### Большой текст (из файла)

```typescript
import { readFileSync } from 'fs';

const largeText = readFileSync('article.txt', 'utf-8');

const result = await fetch('/api/translator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: largeText,
    fromLang: 'English',
    toLang: 'Russian',
    maxParallel: 8 // Больше параллелизма для больших текстов
  })
}).then(r => r.json());

console.log(`Обработано ${result.stats.chunksCount} чанков`);
console.log(`Время: ${result.stats.processingTime / 1000}с`);
```

---

## 🌍 Разные языковые пары

### English → Russian

```typescript
const result = await translateText({
  text: 'Hello, world!',
  fromLang: 'English',
  toLang: 'Russian'
});
// "Привет, мир!"
```

### Russian → English

```typescript
const result = await translateText({
  text: 'Привет, мир!',
  fromLang: 'Russian',
  toLang: 'English'
});
// "Hello, world!"
```

### English → Spanish

```typescript
const result = await translateText({
  text: 'Hello, world!',
  fromLang: 'English',
  toLang: 'Spanish'
});
// "¡Hola, mundo!"
```

### Chinese → English

```typescript
const result = await translateText({
  text: '你好世界',
  fromLang: 'Chinese',
  toLang: 'English'
});
// "Hello world"
```

---

## 🔄 Batch перевод

### Перевод массива текстов

```typescript
async function translateBatch(texts: string[]) {
  const promises = texts.map(text => 
    fetch('/api/translator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        fromLang: 'English',
        toLang: 'Russian'
      })
    }).then(r => r.json())
  );

  return await Promise.all(promises);
}

// Использование
const texts = [
  'Hello!',
  'How are you?',
  'Goodbye!'
];

const results = await translateBatch(texts);
results.forEach(r => console.log(r.result));
// "Привет!"
// "Как дела?"
// "До свидания!"
```

---

## 📊 Получение статистики

```typescript
const response = await fetch('/api/translator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: largeText,
    fromLang: 'English',
    toLang: 'Russian'
  })
}).then(r => r.json());

console.log('📊 Статистика перевода:');
console.log(`Исходный текст: ${response.stats.originalLength} символов`);
console.log(`Переведенный текст: ${response.stats.translatedLength} символов`);
console.log(`Количество чанков: ${response.stats.chunksCount}`);
console.log(`Использовано токенов: ~${response.stats.estimatedTokens}`);
console.log(`Время обработки: ${response.stats.processingTime}мс`);
```

---

## ⚡ Оптимизация производительности

### Увеличение параллелизма

```typescript
// Для больших текстов
const result = await fetch('/api/translator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: veryLargeText,
    maxParallel: 10 // Больше параллельных запросов
  })
}).then(r => r.json());
```

### Предварительная проверка размера

```typescript
function estimateTranslationTime(textLength: number): number {
  const chunks = Math.ceil(textLength / 3500);
  const avgTimePerChunk = 600; // ~600ms per chunk
  const parallelism = 5;
  
  return Math.ceil(chunks / parallelism) * avgTimePerChunk;
}

const text = 'very long text...';
const estimatedTime = estimateTranslationTime(text.length);
console.log(`Estimated time: ~${estimatedTime / 1000}s`);
```

---

## 🧪 Тестовые примеры

### Простой тест

```typescript
import { describe, it, expect } from 'vitest';

describe('Translator API', () => {
  it('should translate short text', async () => {
    const response = await fetch('/api/translator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello',
        fromLang: 'English',
        toLang: 'Russian'
      })
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.result).toBeTruthy();
    expect(data.stats.chunksCount).toBe(1);
  });

  it('should handle empty text', async () => {
    const response = await fetch('/api/translator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: ''
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
```

---

## 🔧 React Hook

### Custom Hook для перевода

```typescript
import { useState } from 'react';

interface TranslateOptions {
  fromLang?: string;
  toLang?: string;
  maxParallel?: number;
}

export function useTranslator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = async (text: string, options: TranslateOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          fromLang: options.fromLang || 'English',
          toLang: options.toLang || 'Russian',
          maxParallel: options.maxParallel || 5
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Translation failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { translate, isLoading, error };
}

// Использование в компоненте
function MyComponent() {
  const { translate, isLoading, error } = useTranslator();

  const handleTranslate = async () => {
    const result = await translate('Hello!', {
      fromLang: 'English',
      toLang: 'Russian'
    });
    console.log(result.result);
  };

  return (
    <div>
      <button onClick={handleTranslate} disabled={isLoading}>
        {isLoading ? 'Translating...' : 'Translate'}
      </button>
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

---

## 🎨 React Component с прогрессом

```typescript
'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function TranslatorWidget() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const handleTranslate = async () => {
    setIsLoading(true);
    setProgress('Preparing...');

    try {
      // Показываем прогресс
      const chunks = Math.ceil(text.length / 3500);
      setProgress(`Processing ${chunks} chunks...`);

      const response = await fetch('/api/translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      setProgress('Finalizing...');

      const data = await response.json();
      setResult(data.result);
      setProgress('Done!');
    } catch (error) {
      setProgress('Error!');
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(''), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-4 border rounded"
        placeholder="Enter text..."
      />
      
      <button
        onClick={handleTranslate}
        disabled={isLoading}
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            {progress}
          </>
        ) : (
          'Translate'
        )}
      </button>

      {result && (
        <div className="p-4 bg-gray-50 rounded">
          {result}
        </div>
      )}
    </div>
  );
}
```

---

## 🔒 С авторизацией (если добавите)

```typescript
async function translateWithAuth(text: string, token: string) {
  const response = await fetch('/api/translator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text })
  });

  return response.json();
}
```

---

## 📦 Node.js скрипт

```javascript
// translate-file.js
const fs = require('fs');

async function translateFile(inputPath, outputPath) {
  const text = fs.readFileSync(inputPath, 'utf-8');

  const response = await fetch('http://localhost:3000/api/translator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      fromLang: 'English',
      toLang: 'Russian'
    })
  });

  const data = await response.json();
  fs.writeFileSync(outputPath, data.result);

  console.log('✅ Translation complete!');
  console.log(`📊 Stats: ${JSON.stringify(data.stats, null, 2)}`);
}

// Использование
translateFile('input.txt', 'output.txt');
```

---

## 🌐 cURL примеры

### Базовый запрос

```bash
curl -X POST http://localhost:3000/api/translator \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, world!",
    "fromLang": "English",
    "toLang": "Russian"
  }'
```

### С красивым выводом

```bash
curl -X POST http://localhost:3000/api/translator \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, world!",
    "fromLang": "English",
    "toLang": "Russian"
  }' | jq '.result'
```

### Из файла

```bash
curl -X POST http://localhost:3000/api/translator \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$(cat input.txt)\", \"fromLang\": \"English\", \"toLang\": \"Russian\"}" \
  | jq -r '.result' > output.txt
```

---

## 🎯 Продвинутые примеры

### Перевод с retry логикой

```typescript
async function translateWithRetry(
  text: string, 
  maxRetries = 3
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/api/translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      
      if (data.success) {
        return data.result;
      }

      throw new Error(data.error);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }

  throw new Error('Max retries exceeded');
}
```

### Перевод с кешированием

```typescript
const translationCache = new Map<string, string>();

async function translateWithCache(text: string): Promise<string> {
  const cacheKey = `${text}-en-ru`;
  
  if (translationCache.has(cacheKey)) {
    console.log('✅ Cache hit!');
    return translationCache.get(cacheKey)!;
  }

  const response = await fetch('/api/translator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  }).then(r => r.json());

  translationCache.set(cacheKey, response.result);
  return response.result;
}
```

---

**Готово! Используйте эти примеры для быстрого старта! 🚀**
