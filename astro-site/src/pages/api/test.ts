import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  return new Response(JSON.stringify({
    status: 'ok',
    hasApiKey: !!apiKey,
    keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
