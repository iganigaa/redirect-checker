import { NextRequest } from 'next/server';
import * as cheerio from 'cheerio';

interface ServicePrice {
  service: string;
  price: string;
}

interface CompetitorUrl {
  id: string;
  url: string;
  name?: string;
}

interface Stage1Result {
  ourServiceHTML: string;
  ourPriceHTML: string;
  competitorHTMLs: Record<string, string>;
  competitors: CompetitorUrl[];
}

interface RequestBody {
  stage1Data: Stage1Result;
  apiKey: string;
}

// Determine API endpoint and model based on key prefix
function getAPIConfig(apiKey: string): { endpoint: string; model: string } {
  if (apiKey.startsWith('sk-or-')) {
    return {
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'deepseek/deepseek-chat' // Fast and cheap!
    };
  }
  return {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o'
  };
}

// Legacy function for compatibility
function getAPIEndpoint(apiKey: string): string {
  return getAPIConfig(apiKey).endpoint;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body: RequestBody = await request.json();
        const { stage1Data, apiKey } = body;

        // Helper functions
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

        // Clean HTML
        sendProgress('Очищаем HTML от лишних элементов...');
        
        const cleanHTML = (html: string): string => {
          const $ = cheerio.load(html);
          $('script, style, noscript, iframe, img, svg').remove();
          const text = $('body').text();
          return text.replace(/\s+/g, ' ').trim();
        };

        const ourServiceText = cleanHTML(stage1Data.ourServiceHTML);
        const ourPriceText = cleanHTML(stage1Data.ourPriceHTML);
        const competitorTexts: Record<string, string> = {};
        
        console.log(`[Stage2] Our service text: ${ourServiceText.length} chars`);
        console.log(`[Stage2] Our price text: ${ourPriceText.length} chars`);
        
        for (const [name, html] of Object.entries(stage1Data.competitorHTMLs)) {
          const cleanedText = cleanHTML(html);
          competitorTexts[name] = cleanedText;
          console.log(`[Stage2] Competitor ${name}: ${cleanedText.length} chars`);
        }

        // Extract prices from our site
        sendProgress('Анализируем ваш сайт с помощью AI...');
        
        const ourServices = await extractPrices(
          ourServiceText,
          ourPriceText,
          apiKey,
          'our_site'
        );

        console.log(`[Stage2] Our services found: ${ourServices.length}`);
        
        if (ourServices.length === 0) {
          sendError('Не удалось найти услуги и цены на вашем сайте. Проверьте страницы.');
          controller.close();
          return;
        }

        // Extract prices from competitors
        sendProgress('Анализируем конкурентов с помощью AI...');
        
        const competitorPrices = new Map<string, ServicePrice[]>();
        
        let processed = 0;
        for (const [name, text] of Object.entries(competitorTexts)) {
          processed++;
          sendProgress(`Анализируем конкурента ${processed}/${Object.keys(competitorTexts).length}: ${name}...`);
          
          const prices = await extractPrices(text, '', apiKey, name);
          console.log(`[Stage2] Competitor ${name} services found: ${prices.length}`);
          competitorPrices.set(name, prices);
        }

        // Send extracted prices (without matching)
        sendProgress('Цены извлечены! Проверьте результаты.');
        
        const stage2Result = {
          ourServices,
          competitors: Object.fromEntries(competitorPrices)
        };
        
        console.log(`[Stage2] Sending extracted prices:`, JSON.stringify({
          ourServicesCount: ourServices.length,
          competitorsCount: Object.keys(stage2Result.competitors).length
        }));
        
        // Send as stage2_complete
        const data = JSON.stringify({ type: 'stage2_complete', data: stage2Result });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));

        controller.close();
      } catch (error) {
        console.error('[Stage2] Error:', error);
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

// Extract prices using AI
async function extractPrices(
  text: string,
  additionalText: string,
  apiKey: string,
  source: string
): Promise<ServicePrice[]> {
  const combinedText = additionalText ? `${text}\n\n${additionalText}` : text;
  
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
    const config = getAPIConfig(apiKey);
    console.log(`[extractPrices] Using ${config.model} at ${config.endpoint} for ${source}`);
    
    const requestBody: any = {
      model: config.model,
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
    };
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    if (apiKey.startsWith('sk-or-')) {
      headers['HTTP-Referer'] = 'https://i-burdukov.ru';
      headers['X-Title'] = 'Price Comparator';
    }
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const parsed = JSON.parse(content);
    
    console.log(`[extractPrices] ${source}: found ${parsed.services?.length || 0} services`);
    
    if (parsed.services && Array.isArray(parsed.services)) {
      return parsed.services;
    }
    
    return [];
  } catch (error) {
    console.error(`[extractPrices] Error for ${source}:`, error);
    return [];
  }
}


