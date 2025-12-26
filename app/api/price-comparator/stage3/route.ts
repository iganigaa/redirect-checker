import { NextRequest } from 'next/server';

interface ServicePrice {
  service: string;
  price: string;
}

interface Stage2Result {
  ourServices: ServicePrice[];
  competitors: Record<string, ServicePrice[]>;
}

interface RequestBody {
  stage2Data: Stage2Result;
  apiKey: string;
}

// Determine API endpoint based on key prefix
function getAPIEndpoint(apiKey: string): string {
  if (apiKey.startsWith('sk-or-')) {
    return 'https://openrouter.ai/api/v1/chat/completions';
  }
  return 'https://api.openai.com/v1/chat/completions';
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body: RequestBody = await request.json();
        const { stage2Data, apiKey } = body;

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

        sendProgress('Сопоставляем услуги с помощью AI...');

        console.log('[Stage3] Matching services');
        console.log(`[Stage3] Our services: ${stage2Data.ourServices.length}`);
        console.log(`[Stage3] Competitors: ${Object.keys(stage2Data.competitors).length}`);

        // Match services using AI
        const comparison = await matchServices(
          stage2Data.ourServices,
          stage2Data.competitors,
          apiKey
        );

        console.log(`[Stage3] Comparison created: ${comparison.length} rows`);

        // Send final result
        sendResult({
          ourServices: stage2Data.ourServices,
          competitors: stage2Data.competitors,
          comparison
        });

        controller.close();
      } catch (error) {
        console.error('[Stage3] Error:', error);
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

// Match services between our site and competitors
async function matchServices(
  ourServices: ServicePrice[],
  competitors: Record<string, ServicePrice[]>,
  apiKey: string
): Promise<Array<{
  service: string;
  ourPrice: string;
  competitorPrices: Record<string, string>;
}>> {
  const prompt = `У нас есть список наших услуг и цены конкурентов. Твоя задача - сопоставить услуги конкурентов с нашими услугами.

КРИТИЧЕСКИ ВАЖНО:
1. Сопоставляй ТОЛЬКО идентичные или очень похожие услуги
2. Если услуги отличаются параметрами (площадь, количество комнат, время и т.д.), НЕ сопоставляй их
3. "Профессиональная гигиена полости рта" = "Гигиена полости рта" (можно сопоставить)
4. "Чистка зубов Air Flow" = "Чистка с Air Flow" (можно сопоставить)
5. "Лечение кариеса 1 зуба" ≠ "Лечение кариеса 2 зубов" (НЕ сопоставлять!)
6. Будь консервативен - лучше оставить пустым, чем сопоставить неправильно

Наши услуги:
${JSON.stringify(ourServices, null, 2)}

Конкуренты:
${JSON.stringify(competitors, null, 2)}

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
    const apiEndpoint = getAPIEndpoint(apiKey);
    console.log(`[matchServices] Using API: ${apiEndpoint}`);
    
    const requestBody: any = {
      model: apiKey.startsWith('sk-or-') ? 'openai/gpt-4o' : 'gpt-4o',
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
    };
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    if (apiKey.startsWith('sk-or-')) {
      headers['HTTP-Referer'] = 'https://i-burdukov.ru';
      headers['X-Title'] = 'Price Comparator';
    }
    
    const response = await fetch(apiEndpoint, {
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
    
    console.log(`[matchServices] Parsed response:`, JSON.stringify(parsed).substring(0, 500));
    console.log(`[matchServices] Comparison items: ${parsed.comparison?.length || 0}`);
    
    return parsed.comparison || [];
  } catch (error) {
    console.error('[matchServices] Error:', error);
    
    // Fallback: create comparison without matching
    console.log('[matchServices] Using fallback');
    return ourServices.map(service => ({
      service: service.service,
      ourPrice: service.price,
      competitorPrices: Object.fromEntries(
        Object.keys(competitors).map(name => [name, ''])
      )
    }));
  }
}

