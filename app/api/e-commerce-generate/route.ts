import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, model } = await request.json();
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key is missing' },
        { status: 401 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is missing' },
        { status: 400 }
      );
    }

    // Clean API key
    const cleanApiKey = apiKey
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/^Bearer\s+/i, '')
      .trim();

    const referer = request.headers.get('referer') || 'http://localhost:3000';

    const body: any = {
      model: model || 'deepseek/deepseek-chat',
      messages: [
        { role: "system", content: "You are a professional copywriter for e-commerce." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    };

    // Apply safety settings ONLY for Google models
    if (model && (model.includes('google') || model.includes('gemini'))) {
      body.safety_settings = [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ];
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cleanApiKey}`,
        "HTTP-Referer": referer,
        "X-Title": "E-commerce Generator",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let errorMsg = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errData = await response.json();
        
        if (errData.error?.message) {
          errorMsg = errData.error.message;
        } else if (errData.error?.metadata?.raw_error) {
          errorMsg = errData.error.metadata.raw_error;
        } else if (typeof errData === 'object') {
          errorMsg = JSON.stringify(errData);
        }

        if (errorMsg.includes("Blocked by Google")) {
          errorMsg += " (AI falsely flagged content. Try DeepSeek model).";
        }
        if (errorMsg.includes("cookie auth") || errorMsg.includes("credentials")) {
          errorMsg += " (Auth failed. Check if API Key is valid OpenRouter key, not Google AI Studio key).";
        }
        if (errorMsg.includes("User not found") || errorMsg.includes("user not found")) {
          errorMsg += " (Invalid API key or account issue. Please check your OpenRouter API key).";
        }
      } catch (e) {
        const textError = await response.text();
        if (textError) errorMsg = `API Error: ${textError}`;
      }
      
      return NextResponse.json(
        { error: errorMsg },
        { status: response.status }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Cleanup code blocks if the model wraps them
    if (content.startsWith('```html')) {
      content = content.replace(/^```html/, '').replace(/```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```/, '').replace(/```$/, '');
    }

    return NextResponse.json({ 
      content: content.trim() 
    });
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown API error" },
      { status: 500 }
    );
  }
}


