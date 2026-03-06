import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for bypassing RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Rate limiting (in-memory, resets on cold start)
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record || now > record.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateFingerprint(userAgent: string, ip: string, acceptLanguage: string): string {
  const raw = `${userAgent}|${acceptLanguage}|${ip.split('.').slice(0, 3).join('.')}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function parseUserAgent(ua: string): { device_type: string; browser: string; os: string } {
  const uaLower = ua.toLowerCase();

  let device_type = 'desktop';
  if (uaLower.includes('mobile') || (uaLower.includes('android') && uaLower.includes('mobile'))) {
    device_type = 'mobile';
  } else if (uaLower.includes('tablet') || uaLower.includes('ipad')) {
    device_type = 'tablet';
  }

  let browser = 'Other';
  if (uaLower.includes('chrome') && !uaLower.includes('edg')) browser = 'Chrome';
  else if (uaLower.includes('firefox')) browser = 'Firefox';
  else if (uaLower.includes('safari') && !uaLower.includes('chrome')) browser = 'Safari';
  else if (uaLower.includes('edg')) browser = 'Edge';

  let os = 'Other';
  if (uaLower.includes('windows')) os = 'Windows';
  else if (uaLower.includes('mac os') || uaLower.includes('macos')) os = 'macOS';
  else if (uaLower.includes('linux')) os = 'Linux';
  else if (uaLower.includes('android')) os = 'Android';
  else if (uaLower.includes('iphone') || uaLower.includes('ipad')) os = 'iOS';

  return { device_type, browser, os };
}

async function notifySlack(visitor: {
  visitor_id: string;
  ip_address: string;
  device_type: string;
  browser: string;
  os: string;
  landing_page?: string;
  referrer?: string;
  utm_source?: string;
}) {
  if (!slackWebhookUrl) return;

  try {
    const blocks = [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*New Visitor on Noosphere.tech* :eyes:` }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*IP:*\n\`${visitor.ip_address || 'unknown'}\`` },
          { type: 'mrkdwn', text: `*Device:*\n${visitor.device_type} / ${visitor.browser} / ${visitor.os}` },
          { type: 'mrkdwn', text: `*Landing:*\n${visitor.landing_page || '/'}` },
          { type: 'mrkdwn', text: `*Referrer:*\n${visitor.referrer || 'direct'}` },
        ]
      }
    ];

    if (visitor.utm_source) {
      blocks.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `UTM Source: ${visitor.utm_source}` }]
      } as any);
    }

    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks })
    });
  } catch (e) {
    console.error('Slack notification failed:', e);
  }
}

async function notifySlackAssistant(data: {
  ip_address: string;
  page_path: string;
  user_message: string;
  persona?: string;
}) {
  if (!slackWebhookUrl) return;

  try {
    const blocks = [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*AI Assistant Used* :robot_face:` }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*IP:*\n\`${data.ip_address || 'unknown'}\`` },
          { type: 'mrkdwn', text: `*Page:*\n${data.page_path || '/'}` },
          { type: 'mrkdwn', text: `*Persona:*\n${data.persona || 'not detected'}` },
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Question:*\n> ${data.user_message.slice(0, 500)}` }
      }
    ];

    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks })
    });
  } catch (e) {
    console.error('Slack assistant notification failed:', e);
  }
}

interface EventPayload {
  event_type: string;
  event_name: string;
  event_category?: string;
  page_url?: string;
  page_path?: string;
  page_title?: string;
  element_id?: string;
  element_class?: string;
  element_text?: string;
  scroll_depth?: number;
  time_on_page?: number;
  assistant_message?: string;
  assistant_response?: string;
  properties?: Record<string, unknown>;
}

interface TrackRequest {
  org_id: string;
  fingerprint?: string;
  session_id?: string;
  events: EventPayload[];
  landing_page?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Telemetry not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    const acceptLanguage = request.headers.get('accept-language') || '';

    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payload: TrackRequest = await request.json();

    if (!payload.org_id || !payload.events || !Array.isArray(payload.events)) {
      return new Response(JSON.stringify({ error: 'Invalid request: org_id and events required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (payload.events.length > 50) {
      return new Response(JSON.stringify({ error: 'Too many events (max 50)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const orgId = payload.org_id;
    const fingerprint = payload.fingerprint || generateFingerprint(userAgent, ip, acceptLanguage);
    const uaInfo = parseUserAgent(userAgent);

    // Get or create visitor
    let visitorId: string;
    const { data: existingVisitor } = await supabase
      .from('site_visitors')
      .select('visitor_id')
      .eq('org_id', orgId)
      .eq('fingerprint', fingerprint)
      .single();

    if (existingVisitor) {
      visitorId = existingVisitor.visitor_id;
      await supabase
        .from('site_visitors')
        .update({ last_seen: new Date().toISOString() })
        .eq('visitor_id', visitorId);
    } else {
      visitorId = generateId('vis');
      await supabase.from('site_visitors').insert({
        visitor_id: visitorId,
        org_id: orgId,
        fingerprint,
        ip_address: ip,
        device_type: uaInfo.device_type,
        browser: uaInfo.browser,
        os: uaInfo.os,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      });

      await notifySlack({
        visitor_id: visitorId,
        ip_address: ip,
        device_type: uaInfo.device_type,
        browser: uaInfo.browser,
        os: uaInfo.os,
        landing_page: payload.landing_page,
        referrer: payload.referrer,
        utm_source: payload.utm_source,
      });
    }

    // Get or create session
    let sessionId = payload.session_id;

    if (sessionId) {
      const { data: existingSession } = await supabase
        .from('site_sessions')
        .select('session_id')
        .eq('session_id', sessionId)
        .single();

      if (!existingSession) {
        sessionId = undefined;
      }
    }

    if (!sessionId) {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: recentSession } = await supabase
        .from('site_sessions')
        .select('session_id')
        .eq('org_id', orgId)
        .eq('visitor_id', visitorId)
        .gt('started_at', thirtyMinsAgo)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (recentSession) {
        sessionId = recentSession.session_id;
      } else {
        sessionId = generateId('sess');
        await supabase.from('site_sessions').insert({
          session_id: sessionId,
          org_id: orgId,
          visitor_id: visitorId,
          landing_page: payload.landing_page,
          referrer: payload.referrer,
          utm_source: payload.utm_source,
          utm_medium: payload.utm_medium,
          utm_campaign: payload.utm_campaign,
          utm_content: payload.utm_content,
          utm_term: payload.utm_term,
          started_at: new Date().toISOString(),
        });

        await supabase.rpc('increment_visitor_sessions', { vid: visitorId });
      }
    }

    // Track events
    const eventsToInsert = payload.events.map(event => ({
      event_id: generateId('evt'),
      org_id: orgId,
      visitor_id: visitorId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      event_type: event.event_type,
      event_name: event.event_name,
      event_category: event.event_category,
      page_url: event.page_url,
      page_path: event.page_path,
      page_title: event.page_title,
      element_id: event.element_id,
      element_class: event.element_class,
      element_text: event.element_text?.slice(0, 200),
      scroll_depth: event.scroll_depth,
      time_on_page: event.time_on_page,
      assistant_message: event.assistant_message?.slice(0, 1000),
      assistant_response: event.assistant_response?.slice(0, 2000),
      properties: event.properties || {},
    }));

    await supabase.from('site_events').insert(eventsToInsert);

    // Notify Slack for AI assistant usage
    for (const event of payload.events) {
      if (event.event_type === 'assistant_message' && event.assistant_message) {
        await notifySlackAssistant({
          ip_address: ip,
          page_path: event.page_path || '/',
          user_message: event.assistant_message,
          persona: event.properties?.persona as string,
        });
      }
    }

    // Update counters
    const pageViews = payload.events.filter(e => e.event_type === 'page_view').length;
    const assistantMessages = payload.events.filter(e => e.event_type === 'assistant_message').length;
    const maxScroll = Math.max(...payload.events.filter(e => e.scroll_depth).map(e => e.scroll_depth || 0), 0);

    if (pageViews > 0) {
      await supabase.rpc('increment_session_page_views', { sid: sessionId, count: pageViews });
    }
    if (assistantMessages > 0) {
      await supabase.rpc('increment_session_assistant', { sid: sessionId, count: assistantMessages });
    }
    if (maxScroll > 0) {
      await supabase
        .from('site_sessions')
        .update({ max_scroll_depth: maxScroll })
        .eq('session_id', sessionId)
        .lt('max_scroll_depth', maxScroll);
    }

    const lastPageView = [...payload.events].reverse().find(e => e.event_type === 'page_view');
    if (lastPageView?.page_path) {
      await supabase
        .from('site_sessions')
        .update({ exit_page: lastPageView.page_path })
        .eq('session_id', sessionId);
    }

    if (pageViews > 0) {
      await supabase.rpc('increment_visitor_page_views', { vid: visitorId, count: pageViews });
    }
    await supabase.rpc('increment_visitor_events', { vid: visitorId, count: payload.events.length });

    return new Response(JSON.stringify({
      success: true,
      visitor_id: visitorId,
      session_id: sessionId,
      events_tracked: payload.events.length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Telemetry error:', error);
    return new Response(JSON.stringify({ error: 'Failed to track events' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
