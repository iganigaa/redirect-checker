import { NextRequest } from 'next/server';
import * as cheerio from 'cheerio';

interface CompetitorUrl {
  id: string;
  url: string;
  name?: string;
}

interface ServicePrice {
  service: string;
  price: string;
}

interface RequestBody {
  ourServiceUrl: string;
  ourPriceUrl: string;
  competitors: CompetitorUrl[];
  apiKey: string;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body: RequestBody = await request.json();
        const { ourServiceUrl, ourPriceUrl, competitors, apiKey } = body;

        // Helper function to send SSE messages
        const sendProgress = (message: string) => {
          const data = JSON.stringify({ type: 'progress', message });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        const sendError = (message: string) => {
          const data = JSON.stringify({ type: 'error', message });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        const sendResult = (data: unknown) => {
          const jsonData = JSON.stringify({ type: 'result', data });
          controller.enqueue(encoder.encode(`data: ${jsonData}\n\n`));
        };

        // Step 1: Fetch all HTML pages
        sendProgress('Загружаем HTML страниц...');
        
        const fetchHTML = async (url: string): Promise<string> => {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status}`);
          }
          return await response.text();
        };

        let ourServiceHTML: string;
        let ourPriceHTML: string;
        const competitorHTMLs: Map<string, string> = new Map();

        try {
          [ourServiceHTML, ourPriceHTML] = await Promise.all([
            fetchHTML(ourServiceUrl),
            fetchHTML(ourPriceUrl)
          ]);

          sendProgress(`Загружаем страницы конкурентов (${competitors.length})...`);

          for (const competitor of competitors) {
            const html = await fetchHTML(competitor.url);
            const name = competitor.name || competitor.url;
            competitorHTMLs.set(name, html);
          }
        } catch (error) {
          sendError(`Ошибка загрузки HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
          controller.close();
          return;
        }

        // Step 2: Clean HTML (remove scripts, styles, etc.)
        sendProgress('Очищаем HTML от лишних элементов...');
        
        const cleanHTML = (html: string): string => {
          const $ = cheerio.load(html);
          
          // Remove unwanted elements
          $('script, style, noscript, iframe, img, svg').remove();
          
          // Get text content
          const text = $('body').text();
          
          // Clean up whitespace
          return text.replace(/\s+/g, ' ').trim();
        };

        const ourServiceText = cleanHTML(ourServiceHTML);
        const ourPriceText = cleanHTML(ourPriceHTML);
        const competitorTexts = new Map<string, string>();
        
        for (const [name, html] of competitorHTMLs.entries()) {
          competitorTexts.set(name, cleanHTML(html));
        }

        // Step 3: Extract prices from our site using LLM
        sendProgress('Анализируем ваш сайт с помощью AI...');
        
        const ourServices = await extractPrices(
          ourServiceText,
          ourPriceText,
          apiKey,
          'our_site'
        );

        console.log(`[Main] Our services found: ${ourServices.length}`);
        
        if (ourServices.length === 0) {
          sendError('Не удалось найти услуги и цены на вашем сайте. Проверьте URL.');
          controller.close();
          return;
        }

        // Step 4: Extract prices from competitors
        sendProgress('Анализируем конкурентов с помощью AI...');
        
        const competitorPrices = new Map<string, ServicePrice[]>();
        
        let processed = 0;
        for (const [name, text] of competitorTexts.entries()) {
          processed++;
          sendProgress(`Анализируем конкурента ${processed}/${competitorTexts.size}: ${name}...`);
          
          const prices = await extractPrices(text, '', apiKey, name);
          console.log(`[Main] Competitor ${name} services found: ${prices.length}`);
          competitorPrices.set(name, prices);
        }

        // Step 5: Match services and create comparison table
        sendProgress('Сопоставляем услуги и создаем сводную таблицу...');
        
        const comparison = await matchServices(
          ourServices,
          competitorPrices,
          apiKey
        );

        console.log(`[Main] Comparison rows: ${comparison.length}`);

        // Send final result
        const resultData = {
          ourServices,
          competitors: Object.fromEntries(competitorPrices),
          comparison
        };
        
        console.log(`[Main] Sending result:`, JSON.stringify({
          ourServicesCount: ourServices.length,
          competitorsCount: competitorPrices.size,
          comparisonCount: comparison.length
        }));
        
        sendResult(resultData);

        controller.close();
      } catch (error) {
        console.error('Error in price comparison:', error);
        const data = JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Extract prices from text using OpenAI
async function extractPrices(
  text: string,
  additionalText: string,
  apiKey: string,
  source: string
): Promise<ServicePrice[]> {
  const combinedText = additionalText ? `${text}\n\n${additionalText}` : text;
  
  // Truncate if too long (GPT-4 has token limits)
  const maxChars = 30000;
  const truncatedText = combinedText.length > maxChars 
    ? combinedText.substring(0, maxChars) + '...[текст обрезан]'
    : combinedText;

  const prompt = `Проанализируй следующий текст со страницы сайта и извлеки ВСЕ цены на услуги.

ВАЖНО:
1. Найди все упоминания цен в любом формате (рубли, доллары, через тире, от-до и т.д.)
2. Извлеки названия услуг максимально точно, как они указаны на сайте
3. Если указан диапазон цен, укажи его как есть (например, "от 5000 до 10000 руб.")
4. Если цена зависит от параметров (площадь, количество комнат и т.д.), укажи это в названии услуги
5. Найди цены из таблиц, списков, JSON-LD разметки, текста - из любых мест на странице

Источник: ${source}

Текст страницы:
${truncatedText}

Верни результат СТРОГО в формате JSON объекта:
{
  "services": [
    {"service": "Название услуги точно как на сайте", "price": "Цена с указанием валюты"},
    {"service": "Другая услуга", "price": "Цена"}
  ]
}

Если на странице нет цен или услуг, верни: {"services": []}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по извлечению ценовой информации из текста. Возвращай только валидный JSON без дополнительных объяснений.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    const parsed = JSON.parse(content);
    
    console.log(`[extractPrices] Source: ${source}, Parsed:`, JSON.stringify(parsed).substring(0, 500));
    
    // Handle different response formats
    if (Array.isArray(parsed)) {
      console.log(`[extractPrices] Returning array with ${parsed.length} items`);
      return parsed;
    } else if (parsed.services && Array.isArray(parsed.services)) {
      console.log(`[extractPrices] Returning services array with ${parsed.services.length} items`);
      return parsed.services;
    } else if (parsed.prices && Array.isArray(parsed.prices)) {
      console.log(`[extractPrices] Returning prices array with ${parsed.prices.length} items`);
      return parsed.prices;
    }
    
    console.log(`[extractPrices] No valid format found, returning empty array`);
    return [];
  } catch (error) {
    console.error(`[extractPrices] Error for ${source}:`, error);
    if (error instanceof Error) {
      console.error(`[extractPrices] Error message:`, error.message);
      console.error(`[extractPrices] Error stack:`, error.stack);
    }
    return [];
  }
}

// Match services between our site and competitors
async function matchServices(
  ourServices: ServicePrice[],
  competitorPrices: Map<string, ServicePrice[]>,
  apiKey: string
): Promise<Array<{
  service: string;
  ourPrice: string;
  competitorPrices: Record<string, string>;
}>> {
  const competitorsData = Object.fromEntries(competitorPrices);
  
  const prompt = `У нас есть список наших услуг и цены конкурентов. Твоя задача - сопоставить услуги конкурентов с нашими услугами.

КРИТИЧЕСКИ ВАЖНО:
1. Сопоставляй ТОЛЬКО идентичные или очень похожие услуги
2. Если услуги отличаются параметрами (площадь, количество комнат, время и т.д.), НЕ сопоставляй их
3. "Уборка 2-комнатной квартиры" ≠ "Уборка 3-комнатной квартиры"
4. "Установка окна стандартного размера" ≠ "Установка окна нестандартного размера"
5. Будь консервативен - лучше оставить пустым, чем сопоставить неправильно

Наши услуги:
${JSON.stringify(ourServices, null, 2)}

Конкуренты:
${JSON.stringify(competitorsData, null, 2)}

Верни результат СТРОГО в формате JSON:
{
  "comparison": [
    {
      "service": "Название нашей услуги из списка выше",
      "ourPrice": "Наша цена",
      "competitorPrices": {
        "Конкурент 1": "Цена или пустая строка если нет совпадения",
        "Конкурент 2": "Цена или пустая строка если нет совпадения"
      }
    }
  ]
}

В comparison должны быть ВСЕ наши услуги из списка. Для каждого конкурента укажи цену только если услуга точно совпадает.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по сопоставлению услуг. Будь очень точным и консервативным. Возвращай только валидный JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    console.log(`[matchServices] Parsed response:`, JSON.stringify(parsed).substring(0, 500));
    console.log(`[matchServices] Comparison items: ${parsed.comparison?.length || 0}`);
    
    return parsed.comparison || [];
  } catch (error) {
    console.error('[matchServices] Error:', error);
    if (error instanceof Error) {
      console.error('[matchServices] Error message:', error.message);
    }
    
    // Fallback: create comparison without matching
    console.log('[matchServices] Using fallback - creating empty comparison');
    const fallback = ourServices.map(service => ({
      service: service.service,
      ourPrice: service.price,
      competitorPrices: Object.fromEntries(
        Array.from(competitorPrices.keys()).map(name => [name, ''])
      )
    }));
    console.log(`[matchServices] Fallback created ${fallback.length} rows`);
    return fallback;
  }
}

