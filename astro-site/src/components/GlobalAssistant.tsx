import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, X, MessageCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function GlobalAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent, overrideMessage?: string) => {
    e?.preventDefault();
    const messageToSend = overrideMessage || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!overrideMessage) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/blog-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: `This is a conversation with a visitor on the Noosphere Technologies website. Noosphere is building trust infrastructure for the decentralized web - focusing on digital integrity, content authenticity, and agent trust. Help the visitor understand our mission, technology, and how we're working to create a more trustworthy internet.`,
        }),
      });

      if (response.status === 429) {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: "You're asking questions faster than I can keep up! Please wait a moment and try again." },
        ]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages([...newMessages, assistantMessage]);

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantMessage.content += parsed.text;
                setMessages([...newMessages, { ...assistantMessage }]);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'What is Noosphere?',
    'What is digital integrity?',
    'How does trust work for AI agents?',
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7850ff 0%, #5040ff 50%, #ff5078 100%)',
          backgroundSize: '200% auto',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(120, 80, 255, 0.4)',
          zIndex: 1000,
          transition: 'all 0.3s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(120, 80, 255, 0.6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(120, 80, 255, 0.4)';
        }}
      >
        {isOpen ? (
          <X size={24} color="#fff" />
        ) : (
          <MessageCircle size={24} color="#fff" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '380px',
            height: '500px',
            background: 'rgba(10, 10, 15, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
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
              background: 'rgba(120, 80, 255, 0.05)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(120, 80, 255, 0.3), rgba(168, 178, 255, 0.3))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} color="#a8b2ff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>Noosphere Assistant</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Ask me anything</div>
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
            {messages.length === 0 ? (
              <div style={{ padding: '10px 0' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}>
                  Hi! I can help you learn about Noosphere, digital trust, content authenticity, and how we're building infrastructure for a more trustworthy internet.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmit(undefined, q)}
                      style={{
                        background: 'rgba(120, 80, 255, 0.1)',
                        border: '1px solid rgba(120, 80, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#a8b2ff',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(120, 80, 255, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(120, 80, 255, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(120, 80, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(120, 80, 255, 0.2)';
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
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
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: msg.role === 'assistant' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {msg.content || (isLoading && i === messages.length - 1 ? '...' : '')}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Noosphere..."
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '13px',
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
      )}
    </>
  );
}
