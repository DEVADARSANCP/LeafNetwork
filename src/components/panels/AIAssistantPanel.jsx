import { useState, useRef, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:8000';

// ── Capability cards shown at the top ──
const CAPABILITIES = [
    { icon: '🔬', title: 'Disease Detection', sub: 'Upload plant photo' },
    { icon: '📈', title: 'Price Advisory', sub: 'Sell/hold guidance' },
    { icon: '🌱', title: 'Crop Planning', sub: 'Season optimization' },
    { icon: '🗣️', title: 'Voice Support', sub: 'Tamil · Hindi · English' },
];

// ── Quick suggestion chips ──
const SUGGESTIONS = [
    'When should I sell my onions?',
    'Tomato leaf turning yellow — why?',
    'Best crop for next season?',
    'Which mandi has highest price today?',
];

// ── Welcome message on load ──
const WELCOME_MSG = {
    role: 'assistant',
    content:
        'Namaste! 🌿 I\'m your AI farming advisor. Ask me about crop prices, diseases, selling strategy, or farm planning. You can also upload a plant photo for disease detection.',
    timestamp: new Date().toISOString(),
};

// ── API call ──
async function sendChatMessage(messages) {
    const res = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Chat request failed' }));
        throw new Error(err.detail || 'Chat request failed');
    }
    return res.json();
}

// ── Markdown-lite renderer (bold, italic, lists, code) ──
function renderMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/```[\s\S]*?```/g, m => `<pre class="ai-code-block">${m.slice(3, -3).trim()}</pre>`)
        .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        .replace(/\n/g, '<br/>');
}

// ── Message bubble ──
function MessageBubble({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div className={`ai-msg-row ${isUser ? 'ai-msg-row--user' : 'ai-msg-row--bot'}`}>
            {!isUser && <div className="ai-avatar ai-avatar--bot">🌿</div>}
            <div className={`ai-bubble ${isUser ? 'ai-bubble--user' : 'ai-bubble--bot'}`}>
                {isUser ? (
                    <p>{msg.content}</p>
                ) : (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                )}
                <span className="ai-msg-time">
                    {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            {isUser && <div className="ai-avatar ai-avatar--user">👤</div>}
        </div>
    );
}

// ── Typing indicator ──
function TypingIndicator() {
    return (
        <div className="ai-msg-row ai-msg-row--bot">
            <div className="ai-avatar ai-avatar--bot">🌿</div>
            <div className="ai-bubble ai-bubble--bot ai-typing-bubble">
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
            </div>
        </div>
    );
}

// ── Main Panel ──
export default function AIAssistantPanel() {
    const [messages, setMessages] = useState([{ ...WELCOME_MSG }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const sendMessage = useCallback(async (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed || loading) return;

        const userMsg = { role: 'user', content: trimmed, timestamp: new Date().toISOString() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setError(null);
        setLoading(true);

        try {
            const result = await sendChatMessage(newMessages);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: result.reply, timestamp: new Date().toISOString() },
            ]);
        } catch (err) {
            setError(err.message);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: '⚠️ Sorry, I couldn\'t process your request right now. Please check that the backend is running and your Gemini API key is configured.',
                    timestamp: new Date().toISOString(),
                },
            ]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }, [input, messages, loading]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="ai-page">
            {/* ── Header ── */}
            <div className="ai-header">
                <div className="ai-header-left">
                    <div className="ai-header-icon">🤖</div>
                    <div>
                        <h1 className="ai-header-title">AI Agricultural Assistant</h1>
                        <p className="ai-header-sub">Disease detection · Price advisory · Farm planning · Multilingual</p>
                    </div>
                </div>
                <div className="ai-header-right">
                    <span className="ai-online-badge"><span className="ai-online-dot" /> AI Online</span>
                </div>
            </div>

            {/* ── Capability Cards ── */}
            <div className="ai-capabilities">
                {CAPABILITIES.map((c, i) => (
                    <div className="ai-cap-card" key={i}>
                        <span className="ai-cap-icon">{c.icon}</span>
                        <span className="ai-cap-title">{c.title}</span>
                        <span className="ai-cap-sub">{c.sub}</span>
                    </div>
                ))}
            </div>

            {/* ── Chat Area ── */}
            <div className="ai-chat-area" ref={scrollRef}>
                {messages.map((m, i) => (
                    <MessageBubble key={i} msg={m} />
                ))}
                {loading && <TypingIndicator />}
            </div>

            {/* ── Error Banner ── */}
            {error && (
                <div className="ai-error-banner">⚠ {error}</div>
            )}

            {/* ── Suggestion Chips ── */}
            {messages.length <= 2 && (
                <div className="ai-suggestions">
                    {SUGGESTIONS.map((s, i) => (
                        <button key={i} className="ai-chip" onClick={() => sendMessage(s)}>{s}</button>
                    ))}
                </div>
            )}

            {/* ── Input Bar ── */}
            <div className="ai-input-bar">
                <input
                    ref={inputRef}
                    className="ai-input"
                    type="text"
                    placeholder="Ask about crops, prices, diseases..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />
                <button className="ai-send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
