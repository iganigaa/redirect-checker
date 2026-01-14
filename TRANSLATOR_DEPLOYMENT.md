# 🚀 Деплой AI Переводчика на Vercel

## Подготовка к деплою

### 1. Проверьте файлы

Убедитесь, что созданы все необходимые файлы:

```
✅ lib/translator/chunker.ts
✅ lib/translator/openrouter.ts
✅ lib/translator/types.ts
✅ app/api/translator/route.ts
✅ app/translator/page.tsx
✅ app/translator/layout.tsx
✅ components/Sidebar.tsx (обновлен)
```

### 2. Настройте переменные окружения на Vercel

1. Зайдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите ваш проект
3. Settings → Environment Variables
4. Добавьте:

```
OPENROUTER_API_KEY=sk-or-v1-ваш-ключ
```

### 3. Установите максимальное время выполнения

В файле `app/api/translator/route.ts` уже установлено:

```typescript
export const maxDuration = 300; // 5 минут
```

⚠️ **Важно**: Для больших текстов требуется Vercel Pro план (для функций >10 секунд)

### 4. Оптимизация для продакшена

#### Vercel config (vercel.json)

Если у вас есть файл `vercel.json`, добавьте:

```json
{
  "functions": {
    "app/api/translator/route.ts": {
      "maxDuration": 300
    }
  }
}
```

#### Next.js config (next.config.ts)

Убедитесь, что API routes не кешируются:

```typescript
export default {
  // ... другие настройки
  async headers() {
    return [
      {
        source: '/api/translator',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};
```

---

## 🚦 Проверка перед деплоем

### Локальная проверка

```bash
# 1. Установите зависимости
npm install

# 2. Создайте .env.local
echo "OPENROUTER_API_KEY=sk-or-v1-..." > .env.local

# 3. Запустите dev сервер
npm run dev

# 4. Откройте переводчик
open http://localhost:3000/translator

# 5. Протестируйте
# - Короткий текст (100 символов)
# - Средний текст (5000 символов)
# - Большой текст (50000+ символов)
```

### Production build

```bash
# Соберите проект
npm run build

# Запустите production
npm start

# Проверьте работу
open http://localhost:3000/translator
```

---

## 📊 Мониторинг и оптимизация

### 1. Проверка логов

После деплоя, проверьте логи в Vercel Dashboard:

```
Settings → Functions → View Logs
```

Ищите строки:
```
[Translator] Processing X chunks, ~Y tokens
[Translator] Completed in Zms
```

### 2. Оптимизация скорости

Если перевод медленный, измените в `lib/translator/openrouter.ts`:

```typescript
// Увеличьте параллелизм (но следите за rate limits!)
export const MAX_PARALLEL = 8; // вместо 5
```

### 3. Мониторинг ошибок

Типичные ошибки:

| Ошибка | Причина | Решение |
|--------|---------|---------|
| 401 Unauthorized | Неверный API ключ | Проверьте OPENROUTER_API_KEY |
| 429 Rate Limit | Слишком много запросов | Уменьшите maxParallel |
| 504 Timeout | Текст слишком большой | Увеличьте maxDuration |
| 500 Internal | Ошибка в коде | Проверьте логи |

---

## 💰 Оценка стоимости

### OpenRouter (DeepSeek V3)

- Input: $0.14 / 1M tokens
- Output: $0.28 / 1M tokens

### Примеры:

| Запросов/день | Символов/запрос | Стоимость/месяц |
|---------------|-----------------|-----------------|
| 10 | 10,000 | ~$0.50 |
| 100 | 10,000 | ~$5.00 |
| 1,000 | 10,000 | ~$50.00 |

### Vercel

- Free: 100GB bandwidth, 100 GB-hours функций
- Pro ($20/мес): 1TB bandwidth, 1000 GB-hours функций, maxDuration до 5 минут

---

## 🔒 Безопасность

### 1. Защита API

Добавьте rate limiting в `app/api/translator/route.ts`:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 запросов в час
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  
  // ... остальной код
}
```

### 2. Валидация input

В `app/api/translator/route.ts` уже есть:

```typescript
// Ограничение размера текста (необязательно)
const MAX_TEXT_LENGTH = 200000; // 200k символов

if (text.length > MAX_TEXT_LENGTH) {
  return NextResponse.json({
    success: false,
    error: `Текст слишком большой. Максимум ${MAX_TEXT_LENGTH} символов`
  }, { status: 400 });
}
```

---

## 🎯 Checklist перед запуском

- [ ] Все файлы созданы и без ошибок
- [ ] OPENROUTER_API_KEY добавлен в Vercel
- [ ] maxDuration настроен правильно
- [ ] Локальное тестирование пройдено
- [ ] Production build успешен
- [ ] Sidebar обновлен с новой ссылкой
- [ ] Документация написана
- [ ] Rate limiting настроен (опционально)

---

## 🚀 Деплой

```bash
# Коммит изменений
git add .
git commit -m "feat: Add AI Translator with DeepSeek V3"

# Пуш в main
git push origin main
```

Vercel автоматически задеплоит изменения!

---

## ✅ Проверка после деплоя

1. Откройте `https://ваш-домен.vercel.app/translator`
2. Проверьте UI
3. Попробуйте перевести короткий текст
4. Проверьте статистику
5. Проверьте копирование результата

---

**Готово к продакшену! 🎉**
