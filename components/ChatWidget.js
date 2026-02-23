import { useState, useRef, useEffect } from 'react';

export default function ChatWidget({ userId }) {
    // Unique storage key based on userId
    const storageKey = userId ? `nc_${userId}` : 'nc_guest';
    // --- STATE ---
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [sessId, setSessId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [menuPos, setMenuPos] = useState(null);
    const [menuId, setMenuId] = useState(null);

    const messagesEndRef = useRef(null);

    // --- LOGO SVG ---
    const RobotLogo = ({ isLarge = false }) => (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '12%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxSizing: 'border-box'
        }}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                {/* Robot Body */}
                <path d="M12 2C7.58 2 4 5.58 4 10V14C4 15.1 4.9 16 6 16H8V11H6V10C6 6.69 8.69 4 12 4C15.31 4 18 6.69 18 10V11H16V16H18C19.1 16 20 15.1 20 14V10C20 5.58 16.42 2 12 2Z" fill="#FACC15" />
                <rect x="7" y="12" width="10" height="8" rx="2" fill="#FACC15" />

                {/* Blinking Eyes */}
                <g className="robot-eyes">
                    <circle cx="10" cy="15" r="1" fill="white" />
                    <circle cx="14" cy="15" r="1" fill="white" />
                </g>
                <path d="M11 18H13V19H11V18Z" fill="white" opacity="0.4" />
            </svg>
            <style jsx>{`
                .robot-eyes {
                    animation: blink 4s infinite;
                }
                @keyframes blink {
                    0%, 90%, 100% { opacity: 1; transform: scaleY(1); }
                    95% { opacity: 0; transform: scaleY(0.1); }
                }
            `}</style>
        </div>
    );

    // --- HELPERS ---
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // --- SESSION LOGIC ---
    useEffect(() => {
        if (!userId) return; // Wait for userId to be available

        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSessions(parsed);
            } catch (e) {
                console.error("Failed to load sessions", e);
            }
        } else {
            setSessions([]); // Clear sessions if none stored for this user
        }
        startNewChat();

        const handleGlobalClick = () => setMenuPos(null);
        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, [userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const startNewChat = () => {
        if (messages.length > 1) saveCurrentSession();
        setMessages([{ role: 'ai', text: 'Hello! I am your kbank AI assistant. How can I help you today?' }]);
        setSessId(String(Date.now()));
        setInput('');
    };

    const saveCurrentSession = () => {
        if (!sessId || messages.length <= 1) return; // Don't save if only greeting

        const firstUserMsg = messages.find(m => m.role === 'user')?.text || "New Chat";
        const title = firstUserMsg.slice(0, 30) + (firstUserMsg.length > 30 ? "..." : "");

        setSessions(prev => {
            const existingIdx = prev.findIndex(s => s.id === sessId);
            let updated;
            if (existingIdx !== -1) {
                updated = [...prev];
                updated[existingIdx] = { ...updated[existingIdx], h: messages, t: title };
            } else {
                updated = [{ id: sessId, t: title, h: messages }, ...prev];
            }
            localStorage.setItem(storageKey, JSON.stringify(updated.slice(0, 20)));
            return updated;
        });
    };

    const loadSession = (id) => {
        if (messages.length > 1) saveCurrentSession();
        const s = sessions.find(x => x.id === id);
        if (!s) return;
        setSessId(id);
        setMessages(s.h);
        if (window.innerWidth <= 768) setSidebarOpen(false);
    };

    const handleContextMenu = (e, id) => {
        e.preventDefault();
        setMenuPos({ x: e.pageX, y: e.pageY });
        setMenuId(id);
    };

    const deleteSession = (e, id) => {
        if (e) e.stopPropagation();
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        if (sessId === id || id === menuId) startNewChat();
        setMenuPos(null);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Could add a toast here
    };

    // --- API HANDLING ---
    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input })
            });

            const data = await res.json();

            if (res.ok) {
                const aiMessage = { role: 'ai', text: data.reply };
                const finalMessages = [...newMessages, aiMessage];
                setMessages(finalMessages);

                // Save after first response
                const firstUserMsg = input;
                const title = firstUserMsg.slice(0, 30) + (firstUserMsg.length > 30 ? "..." : "");
                setSessions(prev => {
                    const existingIdx = prev.findIndex(s => s.id === sessId);
                    let updated;
                    if (existingIdx !== -1) {
                        updated = [...prev];
                        updated[existingIdx] = { ...updated[existingIdx], h: finalMessages };
                    } else {
                        updated = [{ id: sessId, t: title, h: finalMessages }, ...prev];
                    }
                    localStorage.setItem(storageKey, JSON.stringify(updated.slice(0, 20)));
                    return updated;
                });

            } else {
                setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error. Please try again later.' }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Connection lost. Please check your internet.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- UI HELPERS ---
    const toggleMaximize = () => setIsMaximized(!isMaximized);

    const renderChatArea = () => (
        <div className="chat-area-container" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0, // Allow shrinking
            background: isMaximized ? 'rgba(0,0,0,0.2)' : 'transparent'
        }}>
            {/* Messages Area */}
            <div className="messages-scroll" style={{
                flex: 1,
                minHeight: 0,
                padding: isMaximized ? '2rem' : '1.5rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                    }}>
                        <div style={{
                            padding: '0.875rem 1.25rem',
                            borderRadius: msg.role === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                            background: msg.role === 'user' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                            color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                            fontSize: '0.95rem',
                            border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                            position: 'relative',
                            transition: 'all 0.2s',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap', // Support multiline
                            paddingRight: msg.role === 'ai' ? '2.5rem' : '1.25rem'
                        }}>
                            {msg.text}
                            {msg.role === 'ai' && (
                                <button
                                    onClick={() => copyToClipboard(msg.text)}
                                    title="Copy to clipboard"
                                    style={{
                                        position: 'absolute',
                                        right: '0.5rem',
                                        bottom: '0.5rem',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '4px',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        opacity: 0.6,
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    📋
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={{
                        alignSelf: 'flex-start',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '18px 18px 18px 0',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem',
                        border: '1px solid var(--glass-border)',
                        fontStyle: 'italic'
                    }}>
                        thinking...
                    </div>
                )}
                <div ref={messagesEndRef} style={{ height: '1px' }} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} style={{
                padding: '1.25rem',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                gap: '0.75rem',
                background: '#0f172a', // Opaque background
                flexShrink: 0,
                zIndex: 10,
                position: 'relative',
                borderBottomLeftRadius: isMaximized ? '0' : '24px',
                borderBottomRightRadius: isMaximized ? '0' : '24px'
            }}>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Ask kbank AI..."
                    rows={1}
                    style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '0.75rem 1.25rem',
                        color: 'white',
                        outline: 'none',
                        fontSize: '1rem',
                        resize: 'none',
                        maxHeight: '120px',
                        fontFamily: 'inherit',
                        lineHeight: '1.5'
                    }}
                />
                <button type="submit" disabled={isLoading} style={{
                    background: 'var(--primary)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: isLoading ? 0.5 : 1
                }}>
                    <span style={{ color: '#000', fontSize: '1.2rem', fontWeight: 'bold' }}>↑</span>
                </button>
            </form>
        </div>
    );

    return (
        <div className="chat-widget-container" style={{
            position: 'fixed',
            bottom: isMaximized ? '0' : '2rem',
            right: isMaximized ? '0' : '2rem',
            left: isMaximized ? '0' : 'auto',
            top: isMaximized ? '0' : 'auto',
            zIndex: 2000,
            fontFamily: 'var(--font-family)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none' // Root is none, children specify 'all'
        }}>
            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window card" style={{
                    width: isMaximized ? '90vw' : '400px',
                    height: isMaximized ? '85vh' : '550px',
                    maxWidth: isMaximized ? '1200px' : 'calc(100vw - 4rem)',
                    maxHeight: isMaximized ? '900px' : 'calc(100vh - 8rem)',
                    display: 'flex',
                    flexDirection: isMaximized ? 'row' : 'column',
                    padding: '0',
                    overflow: 'hidden',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    pointerEvents: 'all',
                    boxShadow: '0 32px 64px rgba(0,0,0,0.8)',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>

                    {/* MAXIMIZED SIDEBAR */}
                    {isMaximized && sidebarOpen && (
                        <div style={{
                            width: '280px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRight: '1px solid var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ padding: '1.5rem' }}>
                                <button
                                    onClick={startNewChat}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'transparent',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span>+</span> New Chat
                                </button>
                            </div>
                            <div style={{ overflowY: 'auto', flex: 1, padding: '0 1rem' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.5rem' }}>Recent Activity</p>
                                {sessions.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => loadSession(s.id)}
                                        onContextMenu={(e) => handleContextMenu(e, s.id)}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            marginBottom: '0.5rem',
                                            background: sessId === s.id ? 'rgba(250, 204, 21, 0.1)' : 'transparent',
                                            border: sessId === s.id ? '1px solid rgba(250, 204, 21, 0.2)' : '1px solid transparent',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (sessId !== s.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (sessId !== s.id) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <span style={{ fontSize: '0.9rem', color: sessId === s.id ? 'var(--primary)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.t}</span>
                                        <button onClick={(e) => deleteSession(e, s.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: 0.3, fontSize: '0.8rem' }}>🗑</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0, // CRITICAL: Allow this flex child to shrink
                        overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            background: '#0f172a',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            zIndex: 10,
                            position: 'relative',
                            borderTopLeftRadius: isMaximized ? '0' : '24px',
                            borderTopRightRadius: isMaximized ? '0' : '24px',
                            flexShrink: 0 // Keep header fixed height
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '32px', height: '32px' }}>
                                    <RobotLogo />
                                </div>
                                <div>
                                    <span style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--primary)' }}>kbank AI</span>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Powered by NeuraChat</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {!isMaximized && (
                                    <button onClick={startNewChat} title="New Chat" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}>+</button>
                                )}
                                <button onClick={toggleMaximize} title={isMaximized ? "Minimize" : "Maximize"} style={{
                                    background: 'none',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '6px',
                                    width: '24px',
                                    height: '24px',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem'
                                }}>
                                    {isMaximized ? '❐' : '□'}
                                </button>
                                <button onClick={() => { setIsOpen(false); setIsMaximized(false); }} style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    lineHeight: '1',
                                    padding: '0 4px'
                                }}>×</button>
                            </div>
                        </div>

                        {renderChatArea()}
                    </div>
                </div>
            )}

            {/* Floating Bubble Icon */}
            {!isMaximized && !isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '72px',
                        height: '72px',
                        borderRadius: '24px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        pointerEvents: 'all',
                        padding: '0'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1) rotate(0)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                >
                    <div style={{ width: '100%', height: '100%' }}>
                        {isOpen ? (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                color: 'var(--primary)'
                            }}>↓</div>
                        ) : (
                            <RobotLogo />
                        )}
                    </div>
                    {!isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            width: '20px',
                            height: '20px',
                            background: '#ef4444',
                            borderRadius: '50%',
                            border: '3px solid var(--bg-color)',
                            animation: 'bounce 2s infinite'
                        }}></div>
                    )}
                </button>
            )}

            {/* CUSTOM CONTEXT MENU */}
            {menuPos && (
                <div style={{
                    position: 'fixed',
                    top: menuPos.y,
                    left: menuPos.x,
                    zIndex: 3000,
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                    padding: '4px',
                    minWidth: '150px',
                    animation: 'fadeIn 0.1s ease-out',
                    pointerEvents: 'all'
                }}>
                    <button
                        onClick={() => deleteSession(null, menuId)}
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        <span>🗑</span> Delete Chat
                    </button>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(40px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
            `}</style>
        </div>
    );
}
