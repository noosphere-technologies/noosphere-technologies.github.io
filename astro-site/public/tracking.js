/**
 * Voyant Site Telemetry - Lightweight tracking script
 * Add to pages: <script src="/tracking.js" data-org="noosphere"></script>
 */
(function() {
  // Skip tracking for internal/API paths
  const EXCLUDED_PATHS = ['/api/', '/telemetry', '/.well-known/'];
  if (EXCLUDED_PATHS.some(p => location.pathname.includes(p))) return;

  const script = document.currentScript;
  const ORG_ID = script?.getAttribute('data-org') || 'unknown';
  const API_URL = 'https://www.voyant.io/api/telemetry';

  let sessionId = sessionStorage.getItem('v_sid');
  let visitorId = sessionStorage.getItem('v_vid');
  let eventQueue = [];
  let pageLoadTime = Date.now();
  let maxScroll = 0;

  // Generate simple fingerprint
  function fingerprint() {
    const s = [navigator.userAgent, navigator.language, screen.width + 'x' + screen.height].join('|');
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h).toString(36);
  }

  // Get UTM params
  function getUtm() {
    const p = new URLSearchParams(location.search);
    return {
      utm_source: p.get('utm_source'),
      utm_medium: p.get('utm_medium'),
      utm_campaign: p.get('utm_campaign'),
      utm_content: p.get('utm_content'),
      utm_term: p.get('utm_term'),
    };
  }

  // Queue event
  function track(type, name, data = {}) {
    eventQueue.push({
      event_type: type,
      event_name: name,
      page_url: location.href,
      page_path: location.pathname,
      page_title: document.title,
      time_on_page: Math.floor((Date.now() - pageLoadTime) / 1000),
      ...data
    });
  }

  // Flush events to API
  function flush(beacon = false) {
    if (!eventQueue.length) return;

    const payload = {
      org_id: ORG_ID,
      fingerprint: fingerprint(),
      session_id: sessionId,
      events: eventQueue.splice(0, 50),
      landing_page: sessionStorage.getItem('v_lp') || location.pathname,
      referrer: document.referrer,
      ...getUtm()
    };

    if (!sessionStorage.getItem('v_lp')) {
      sessionStorage.setItem('v_lp', location.pathname);
    }

    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon(API_URL, JSON.stringify(payload));
    } else {
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json()).then(data => {
        if (data.session_id) {
          sessionId = data.session_id;
          sessionStorage.setItem('v_sid', data.session_id);
        }
        if (data.visitor_id) {
          visitorId = data.visitor_id;
          sessionStorage.setItem('v_vid', data.visitor_id);
        }
      }).catch(() => {});
    }
  }

  // Track page view
  track('page_view', 'page_view', { event_category: 'navigation' });

  // Track scroll depth
  let scrollTick = false;
  window.addEventListener('scroll', () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      const depth = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (depth > maxScroll + 0.2) {
        maxScroll = depth;
        const pct = Math.floor(depth * 4) * 25;
        if (pct > 0 && pct <= 100) {
          track('scroll', 'scroll_' + pct, { scroll_depth: depth, event_category: 'engagement' });
        }
      }
      scrollTick = false;
    });
  }, { passive: true });

  // Track clicks on links and buttons
  document.addEventListener('click', (e) => {
    const el = e.target.closest('a, button, [data-track]');
    if (el) {
      track('click', el.getAttribute('data-track') || el.textContent?.slice(0, 50) || 'click', {
        event_category: 'engagement',
        element_text: el.textContent?.slice(0, 100),
        element_id: el.id || undefined
      });
    }
  }, { passive: true });

  // Flush periodically
  setInterval(flush, 5000);

  // Flush on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true);
  });
  window.addEventListener('beforeunload', () => flush(true));

  // Initial flush
  setTimeout(flush, 1000);
})();
