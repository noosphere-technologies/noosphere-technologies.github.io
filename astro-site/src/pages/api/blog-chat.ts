import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

// Log API key status on module load
const apiKey = process.env.ANTHROPIC_API_KEY;
console.log('[blog-chat] ========== MODULE LOAD ==========');
console.log('[blog-chat] API key from env:', apiKey ? `Set (length: ${apiKey.length}, starts: ${apiKey.substring(0, 15)}...)` : 'NOT SET - THIS IS THE PROBLEM');
console.log('[blog-chat] All env keys:', Object.keys(process.env).filter(k => k.includes('ANTHROPIC') || k.includes('API')).join(', ') || 'none found');

// Explicitly pass API key to client
const client = apiKey ? new Anthropic({ apiKey }) : null;
console.log('[blog-chat] Client created:', client ? 'YES' : 'NO - client is null');

// Simple in-memory rate limiter
// For production, consider using Upstash Redis: https://upstash.com/docs/redis/sdks/ratelimit-ts
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  console.log('[blog-chat] POST request received');
  console.log('[blog-chat] Client address:', clientAddress);

  // Rate limiting
  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  console.log('[blog-chat] IP for rate limiting:', ip);

  if (isRateLimited(ip)) {
    console.log('[blog-chat] Rate limited');
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  // Check if client is configured
  if (!client) {
    console.error('[blog-chat] ERROR: Anthropic client not initialized - API key missing');
    return new Response(JSON.stringify({
      error: 'AI service not configured. Please set ANTHROPIC_API_KEY environment variable.',
      debug: 'Client is null - API key was not found at module load time'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { messages, context } = body;
    console.log('[blog-chat] Request body parsed');
    console.log('[blog-chat] Messages count:', messages?.length || 0);
    console.log('[blog-chat] Context length:', context?.length || 0);

    if (!messages || !Array.isArray(messages)) {
      console.log('[blog-chat] Invalid messages format');
      return new Response(JSON.stringify({ error: 'Messages required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an expert assistant for Noosphere Technologies, helping readers understand articles about digital trust, content authenticity, and agentic AI systems.

Your role:
- Synthesize and explain concepts from the article
- Connect ideas to broader implications for trust infrastructure
- Help readers understand technical concepts in accessible terms
- Relate topics to real-world applications

Article context:
${context || 'No specific article context provided.'}

Guidelines:
- Be concise but insightful (2-4 sentences typical)
- Use concrete examples when explaining abstract concepts
- Connect to the reader's likely concerns (authenticity, AI trust, decentralization)
- When asked to "clarify" a topic, provide a focused explanation
- Reference specific points from the article when relevant

Noosphere focuses on: digital trust infrastructure, content authenticity (C2PA), trust graphs, agentic AI systems, decentralized trust, and context integrity.`;

    console.log('[blog-chat] Calling Anthropic API...');
    console.log('[blog-chat] Model: claude-3-5-sonnet-latest');

    const stream = await client.messages.stream({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    console.log('[blog-chat] Stream created successfully');

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          console.log('[blog-chat] Starting stream consumption');
          let chunkCount = 0;
          for await (const event of stream) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta;
              if ('text' in delta) {
                chunkCount++;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta.text })}\n\n`));
              }
            }
          }
          console.log('[blog-chat] Stream complete, chunks:', chunkCount);
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('[blog-chat] Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[blog-chat] ERROR:', error);
    console.error('[blog-chat] Error type:', error?.constructor?.name);
    console.error('[blog-chat] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[blog-chat] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error || {})));

    // Check for specific Anthropic errors
    let apiStatus: number | undefined;
    let apiError: unknown;
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      apiStatus = err.status as number | undefined;
      apiError = err.error;
      if (apiStatus) console.error('[blog-chat] API status:', apiStatus);
      if (apiError) console.error('[blog-chat] API error:', JSON.stringify(apiError));
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';

    // Return detailed error for debugging
    return new Response(JSON.stringify({
      error: errorMessage,
      type: error?.constructor?.name || 'Unknown',
      status: apiStatus,
      apiError: apiError,
      hint: apiStatus === 401 ? 'Invalid API key' : apiStatus === 429 ? 'Rate limited by Anthropic' : undefined
    }), {
      status: apiStatus || 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
