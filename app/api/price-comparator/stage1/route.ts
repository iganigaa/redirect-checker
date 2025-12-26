import { NextRequest } from 'next/server';

interface CompetitorUrl {
  id: string;
  url: string;
  name?: string;
}

interface RequestBody {
  ourServiceUrl: string;
  ourPriceUrl: string;
  competitors: CompetitorUrl[];
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body: RequestBody = await request.json();
        const { ourServiceUrl, ourPriceUrl, competitors } = body;

        // Helper function to send SSE messages
        const sendProgress = (message: string) => {
          const data = JSON.stringify({ type: 'progress', message });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        const sendError = (message: string) => {
          const data = JSON.stringify({ type: 'error', message });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        const sendStage1Complete = (data: unknown) => {
          const jsonData = JSON.stringify({ type: 'stage1_complete', data });
          controller.enqueue(encoder.encode(`data: ${jsonData}\n\n`));
        };

        // Fetch HTML pages
        sendProgress('Скачиваем HTML вашего сайта...');
        
        const fetchHTML = async (url: string): Promise<string> => {
          console.log(`[Stage1] Fetching: ${url}`);
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
          }
          const html = await response.text();
          console.log(`[Stage1] Fetched ${url}: ${html.length} bytes`);
          return html;
        };

        let ourServiceHTML: string;
        let ourPriceHTML: string;
        const competitorHTMLs: Record<string, string> = {};

        try {
          [ourServiceHTML, ourPriceHTML] = await Promise.all([
            fetchHTML(ourServiceUrl),
            fetchHTML(ourPriceUrl)
          ]);

          sendProgress(`Скачиваем HTML конкурентов (${competitors.length})...`);

          for (const competitor of competitors) {
            const name = competitor.name || competitor.url;
            sendProgress(`Скачиваем: ${name}...`);
            const html = await fetchHTML(competitor.url);
            competitorHTMLs[name] = html;
          }
        } catch (error) {
          console.error('[Stage1] Fetch error:', error);
          sendError(`Ошибка загрузки HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
          controller.close();
          return;
        }

        // Send HTML data back to client
        console.log('[Stage1] Sending HTML data to client');
        sendStage1Complete({
          ourServiceHTML,
          ourPriceHTML,
          competitorHTMLs,
          competitors
        });

        controller.close();
      } catch (error) {
        console.error('[Stage1] Error:', error);
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

