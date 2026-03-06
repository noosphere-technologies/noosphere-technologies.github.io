import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { HelpCircle } from 'lucide-react';

interface BlogContentWithClarifyProps {
  children: React.ReactNode;
}

function ClarifyButton({ topic }: { topic: string }) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('clarify-topic', { detail: { topic } }));
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        fontSize: '10px',
        fontWeight: 500,
        color: '#a8b2ff',
        background: 'rgba(120, 80, 255, 0.1)',
        border: '1px solid rgba(120, 80, 255, 0.3)',
        borderRadius: '4px',
        cursor: 'pointer',
        marginLeft: '10px',
        verticalAlign: 'middle',
        transition: 'all 0.2s',
        fontFamily: 'Inter, sans-serif',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'rgba(120, 80, 255, 0.2)';
        e.currentTarget.style.borderColor = 'rgba(120, 80, 255, 0.5)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'rgba(120, 80, 255, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(120, 80, 255, 0.3)';
      }}
    >
      <HelpCircle size={10} />
      Clarify
    </button>
  );
}

export default function BlogContentWithClarify({ children }: BlogContentWithClarifyProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const rootsRef = useRef<Map<Element, ReturnType<typeof createRoot>>>(new Map());

  useEffect(() => {
    if (!contentRef.current) return;

    // Find all h2 and h3 elements
    const headings = contentRef.current.querySelectorAll('h2, h3');

    headings.forEach((heading) => {
      // Skip if already has a clarify button
      if (heading.querySelector('.clarify-btn-container')) return;

      const topic = heading.textContent?.trim() || '';
      if (!topic) return;

      // Create container for React component
      const container = document.createElement('span');
      container.className = 'clarify-btn-container';
      heading.appendChild(container);

      // Render React component
      const root = createRoot(container);
      root.render(<ClarifyButton topic={topic} />);
      rootsRef.current.set(container, root);
    });

    // Cleanup function
    return () => {
      rootsRef.current.forEach((root) => {
        root.unmount();
      });
      rootsRef.current.clear();
    };
  }, [children]);

  return (
    <div ref={contentRef} className="article-content">
      {children}
    </div>
  );
}
