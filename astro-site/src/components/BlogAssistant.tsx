import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BlogAssistantProps {
  postContent: string;
  postTitle: string;
}

export default function BlogAssistant({ postContent, postTitle }: BlogAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "What's your role? I'll tailor my answers." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(async (userMessage: string, currentMessages: Message[]) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const allMessages = [...currentMessages, { role: 'user' as const, content: userMessage }];
      const messagesToSend = allMessages.slice(1); // Skip initial assistant message

      const response = await fetch('/api/blog-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSend,
          context: `Title: ${postTitle}\n\n${postContent}`,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let assistantMessage = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        assistantMessage += text;

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantMessage };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [postContent, postTitle]);

  // Listen for clarify events from the content
  useEffect(() => {
    const handleClarify = (e: CustomEvent<{ topic: string }>) => {
      sendMessage(`Clarify: ${e.detail.topic}`, messages);
    };

    window.addEventListener('clarify-topic', handleClarify as EventListener);
    return () => window.removeEventListener('clarify-topic', handleClarify as EventListener);
  }, [messages, sendMessage]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    sendMessage(userMessage, messages);
  };

  const suggestedRoles = [
    "I'm a developer",
    "I'm in security",
    "I'm in compliance",
    "I'm an executive",
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(120, 80, 255, 0.3), rgba(168, 178, 255, 0.3))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={20} color="#a8b2ff" />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>Article Assistant</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Ask about this article</div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background:
                  msg.role === 'assistant'
                    ? 'linear-gradient(135deg, rgba(120, 80, 255, 0.3), rgba(168, 178, 255, 0.3))'
                    : 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {msg.role === 'assistant' ? (
                <Sparkles size={12} color="#a8b2ff" />
              ) : (
                <User size={12} color="rgba(255,255,255,0.7)" />
              )}
            </div>
            <div
              style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: msg.role === 'assistant' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.7)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content || (isLoading && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}

        {/* Suggested roles - show only at start */}
        {messages.length === 1 && (
          <div style={{ paddingTop: '8px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
              Select your role:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {suggestedRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => sendMessage(role, messages)}
                  style={{
                    background: 'rgba(120, 80, 255, 0.1)',
                    border: '1px solid rgba(120, 80, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#a8b2ff',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this article..."
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            background: 'linear-gradient(135deg, #7850ff, #5040ff)',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fff',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !input.trim() ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
