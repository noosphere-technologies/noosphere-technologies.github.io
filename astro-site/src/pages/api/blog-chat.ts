import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

// Non-blocking Slack notification for chat sessions
async function notifySlack(message: string, context: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const articleTitle = context.split('\n')[0]?.replace('Title: ', '') || 'Unknown article';
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `💬 Blog Chat on Noosphere`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*New chat on:* ${articleTitle}\n*Question:* ${message.slice(0, 200)}`
            }
          }
        ]
      })
    });
  } catch (e) {
    // Silent fail - don't block the response
  }
}

const SYSTEM_PROMPT = `You help readers understand this article. Be EXTREMELY concise.

RULES:
- 1-2 sentences max. Never more.
- No bullet points or lists unless asked.
- Plain language, conversational tone.
- One idea per response.
- If not in the article, say "Not covered here" and give a one-line take.

ARTICLE:

`;

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "API not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Notify on first user message (don't spam on follow-ups)
    const userMessages = messages.filter((m: { role: string }) => m.role === 'user');
    if (userMessages.length === 1) {
      notifySlack(userMessages[0].content, context || '');
    }

    const systemPrompt = SYSTEM_PROMPT + (context || "No article content provided.");

    const stream = anthropic.messages.stream({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 300,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (streamError) {
          console.error("Stream error:", streamError);
          controller.error(streamError);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Blog Chat API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: "Failed", details: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
