import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HelpCircle } from 'lucide-react';

function ClarifyButton({ topic }: { topic: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('clarify-topic', { detail: { topic } }));
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        fontSize: '11px',
        fontWeight: 500,
        color: '#a8b2ff',
        background: 'rgba(120, 80, 255, 0.15)',
        border: '1px solid rgba(120, 80, 255, 0.3)',
        borderRadius: '20px',
        cursor: 'pointer',
        marginLeft: '12px',
        verticalAlign: 'middle',
        transition: 'all 0.2s',
        fontFamily: 'Inter, -apple-system, sans-serif',
        letterSpacing: '0.02em',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'rgba(120, 80, 255, 0.25)';
        e.currentTarget.style.borderColor = 'rgba(120, 80, 255, 0.5)';
        e.currentTarget.style.color = '#c8d2ff';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'rgba(120, 80, 255, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(120, 80, 255, 0.3)';
        e.currentTarget.style.color = '#a8b2ff';
      }}
    >
      <HelpCircle size={12} />
      <span>Clarify</span>
    </button>
  );
}

export default function ClarifyInjector() {
  useEffect(() => {
    // Wait a bit for the content to render
    const timer = setTimeout(() => {
      const articleContent = document.querySelector('.article-content');
      if (!articleContent) return;

      const headings = articleContent.querySelectorAll('h2, h3');
      const roots: Array<{ container: Element; root: ReturnType<typeof createRoot> }> = [];

      headings.forEach((heading) => {
        // Skip if already has a clarify button
        if (heading.querySelector('.clarify-btn')) return;

        const topic = heading.textContent?.trim() || '';
        if (!topic) return;

        // Create container for React component
        const container = document.createElement('span');
        container.className = 'clarify-btn';
        container.style.display = 'inline';
        heading.appendChild(container);

        // Render React component
        const root = createRoot(container);
        root.render(<ClarifyButton topic={topic} />);
        roots.push({ container, root });
      });

      // Cleanup function stored for potential future use
      return () => {
        roots.forEach(({ root }) => root.unmount());
      };
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
