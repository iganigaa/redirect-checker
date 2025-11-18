import { NextRequest } from 'next/server';

interface KeywordData {
  word: string;
  pos: number;
  ws: number;
  wsk: number;
  competition: string;
}

interface KeysAPIResponse {
  data: KeywordData[];
  current_page: number;
  last_page: number;
}

interface KeywordResult {
  url: string;
  keyword: string;
  position: number;
  frequency: number;
  exactFrequency: number;
  competition: string;
  date: string;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { apiKey, urls, minFrequency = 1, maxPosition = 10 } = body;

        if (!apiKey) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'API ключ не предоставлен'
          })}\n\n`));
          controller.close();
          return;
        }

        if (!urls || urls.length === 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'Список URL пуст'
          })}\n\n`));
          controller.close();
          return;
        }

        const allResults: KeywordResult[] = [];
        const totalUrls = urls.length;

        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          
          try {
            // Отправляем статус начала обработки
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              url,
              data: {
                status: 'processing',
                progress: Math.round((i / totalUrls) * 100),
                keywordsFound: 0
              }
            })}\n\n`));

            const domain = extractDomain(url);
            const pageUrl = extractPageUrl(url);
            let page = 1;
            let urlKeywordsCount = 0;
            const urlResults: KeywordResult[] = [];

            while (true) {
              // Запрос к API Keys.so
              const apiUrl = new URL('https://api.keys.so/report/simple/organic/keywords/bypage');
              apiUrl.searchParams.append('domain', domain);
              apiUrl.searchParams.append('page_url', pageUrl);
              apiUrl.searchParams.append('base', 'msk');
              apiUrl.searchParams.append('per_page', '100');
              apiUrl.searchParams.append('page', page.toString());
              apiUrl.searchParams.append('filter', `pos<=${maxPosition}`);

              const response = await fetch(apiUrl.toString(), {
                headers: {
                  'X-Keyso-TOKEN': apiKey,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              });

              if (response.status === 202) {
                // Данные еще обрабатываются
                await sleep(5000);
                continue;
              }

              if (!response.ok) {
                throw new Error(`API вернул статус ${response.status}`);
              }

              const data: KeysAPIResponse = await response.json();
              const keywords = data.data || [];

              if (keywords.length === 0) {
                break;
              }

              // Фильтрация и преобразование данных
              for (const keyword of keywords) {
                if (keyword.wsk > minFrequency) {
                  const result: KeywordResult = {
                    url,
                    keyword: keyword.word || '',
                    position: keyword.pos || 0,
                    frequency: keyword.ws || 0,
                    exactFrequency: keyword.wsk || 0,
                    competition: keyword.competition || '',
                    date: new Date().toISOString().split('T')[0]
                  };
                  
                  urlResults.push(result);
                  urlKeywordsCount++;
                }
              }

              // Обновляем прогресс
              const progress = Math.round(((i + (page / (data.last_page || 1))) / totalUrls) * 100);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'status',
                url,
                data: {
                  status: 'processing',
                  progress: Math.min(progress, 99),
                  keywordsFound: urlKeywordsCount
                }
              })}\n\n`));

              // Проверяем, есть ли еще страницы
              if (data.current_page >= data.last_page) {
                break;
              }

              page++;
              await sleep(1000); // Задержка между запросами
            }

            // Добавляем результаты URL в общий массив
            allResults.push(...urlResults);

            // Отправляем промежуточные результаты
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'result',
              data: urlResults
            })}\n\n`));

            // Статус завершения для текущего URL
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              url,
              data: {
                status: 'completed',
                progress: Math.round(((i + 1) / totalUrls) * 100),
                keywordsFound: urlKeywordsCount
              }
            })}\n\n`));

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            
            // Отправляем статус ошибки для URL
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              url,
              data: {
                status: 'error',
                progress: Math.round(((i + 1) / totalUrls) * 100),
                keywordsFound: 0,
                error: errorMessage
              }
            })}\n\n`));

            // Добавляем строку с ошибкой в результаты
            allResults.push({
              url,
              keyword: `ОШИБКА: ${errorMessage}`,
              position: 0,
              frequency: 0,
              exactFrequency: 0,
              competition: '',
              date: new Date().toISOString().split('T')[0]
            });
          }
        }

        // Финальное сообщение
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          totalKeywords: allResults.length,
          totalUrls: urls.length
        })}\n\n`));

        controller.close();

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: errorMessage
        })}\n\n`));
        
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

function extractDomain(url: string): string {
  let domain = url.replace(/^https?:\/\//, '');
  return domain.split('/')[0];
}

function extractPageUrl(url: string): string {
  let path = url.replace(/^https?:\/\//, '');
  const parts = path.split('/');
  
  if (parts.length > 1) {
    return '/' + parts.slice(1).join('/');
  }
  
  return '/';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
