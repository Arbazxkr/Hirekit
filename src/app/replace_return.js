const fs = require('fs');

let content = fs.readFileSync('page.tsx', 'utf8');

const returnStatement = `return (
        <div style={{ display: "flex", height: "100vh" }} className={theme === "dark" ? "dark-theme" : ""}>
            {/* Sidebar */}
            {sidebarOpen && (
                <div style={{ width: 260, borderRight: "1px solid #eee", background: "#fafafa", display: "flex", flexDirection: "column" }} className="sidebar">
                    <div style={{ padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>Chats</span>
                        <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}><Menu size={18} /></button>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                        {sessions.map(s => (
                            <button key={s.id} onClick={() => loadSession(s.id)} style={{
                                width: "100%", padding: "10px 12px", textAlign: "left", borderRadius: 8,
                                border: "none", background: "transparent", cursor: "pointer",
                                fontSize: 13, color: "#333", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                            }}>
                                {s.title}
                            </button>
                        ))}
                    </div>
                    <div style={{ padding: 16, borderTop: "1px solid #eee" }}>
                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{
                            width: "100%", padding: "10px 12px", textAlign: "left", borderRadius: 8,
                            border: "none", background: "transparent", cursor: "pointer",
                            fontSize: 13, color: "#333", display: "flex", alignItems: "center", gap: 8
                        }}>
                            Theme: {theme === 'dark' ? 'Dark' : 'Light'}
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "#fff", transition: "background 0.3s" }} className="main-content">
                <header style={{
                    padding: "10px 20px", borderBottom: "1px solid #eee",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {!sidebarOpen && (
                            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#888" }}>
                                <Menu size={20} />
                            </button>
                        )}
                        <img src="/logo.png" alt="HireKit" style={{ width: 28, height: 28 }} />
                        <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }} className="text-primary">HireKit</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <a href="/profile" style={{ display: "flex", alignItems: "center" }}>
                            {user.avatar ? (
                                <img src={user.avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", cursor: "pointer" }} />
                            ) : (
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#888", cursor: "pointer" }}>{(user.name || "?")[0]}</div>
                            )}
                        </a>
                        <button onClick={handleLogout} style={{
                            fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer",
                        }}>Logout</button>
                    </div>
                </header>

                <main style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
                    <div style={{ maxWidth: 700, margin: "0 auto" }}>
                        {messages.map((msg) => (
                            <div key={msg.id} style={{
                                display: "flex", gap: 10, marginBottom: 20,
                                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                            }}>
                                {msg.role === "assistant" && (
                                    <img src="/logo.png" alt="AI" style={{ width: 28, height: 28, flexShrink: 0, marginTop: 2 }} />
                                )}
                                <div style={{ maxWidth: "85%" }}>
                                    <div style={{
                                        padding: "10px 14px", borderRadius: 16, fontSize: 14, lineHeight: 1.6,
                                        whiteSpace: "pre-wrap",
                                        background: msg.role === "user" ? "#111" : "#f4f4f4",
                                        color: msg.role === "user" ? "#fff" : "#111",
                                        borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                                        borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
                                    }} className={\`msg-bubble \${msg.role}\`}>
                                        {msg.content}
                                    </div>
                                    {msg.role === "assistant" && renderResult(msg)}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                                <img src="/logo.png" alt="AI" style={{ width: 28, height: 28 }} />
                                <div style={{ padding: "10px 14px", background: "#f4f4f4", borderRadius: 16, fontSize: 14 }} className="msg-bubble assistant">
                                    <span className="dot-pulse" style={{ color: "#111" }}>⏳ Thinking...</span>
                                </div>
                            </div>
                        )}

                        {showChips && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, justifyContent: "center" }}>
                                {["I'm a software developer", "Looking for Gulf jobs", "Help me build a resume", "What can you do?"].map((chip) => (
                                    <button key={chip} onClick={() => send(chip)} style={{
                                        padding: "8px 16px", borderRadius: 20, border: "1px solid #ddd",
                                        background: "#fff", fontSize: 13, cursor: "pointer", color: "#555",
                                        transition: "all 0.15s",
                                    }} className="chip"
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; e.currentTarget.style.borderColor = "#bbb"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#ddd"; }}
                                    >{chip}</button>
                                ))}
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>
                </main>

                <div style={{ padding: "12px 16px 20px", borderTop: "1px solid #f0f0f0" }} className="input-area">
                    <div style={{
                        maxWidth: 640, margin: "0 auto",
                        display: "flex", alignItems: "flex-end",
                        border: "1px solid #d9d9d9", borderRadius: 24,
                        padding: "4px 6px 4px 10px", background: "#fff",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                    }} className="input-box">
                        <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md" onChange={handleUpload} style={{ display: "none" }} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploading || loading} style={{
                            width: 32, height: 32, borderRadius: "50%", background: "transparent", border: "none",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: 2, opacity: uploading ? 0.4 : 0.6, transition: "opacity 0.15s", color: "#666"
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
                            title="Upload resume or document"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                        </button>

                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder={uploading ? "Reading file..." : "Message HireKit..."}
                            rows={1}
                            disabled={uploading}
                            style={{
                                flex: 1, border: "none", outline: "none", resize: "none",
                                fontSize: 15, padding: "10px 0", lineHeight: 1.5,
                                maxHeight: 150, fontFamily: "inherit", background: "transparent", color: "#111",
                            }} className="input-field"
                        />

                        <button onClick={() => send()} disabled={!input.trim() || loading || uploading} style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: input.trim() && !loading ? "#000" : "#e5e5e5",
                            color: input.trim() && !loading ? "#fff" : "#999",
                            border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "background 0.15s", marginBottom: 2,
                        }} className="send-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="19" x2="12" y2="5" />
                                <polyline points="5 12 12 5 19 12" />
                            </svg>
                        </button>
                    </div>
                    <p style={{ textAlign: "center", fontSize: 11, color: "#aaa", marginTop: 8 }}>
                        HireKit can make mistakes. Verify important information.
                    </p>
                </div>
            </div>
        </div>
    );
`;

const startIndex = content.indexOf('return (');
if (startIndex !== -1) {
    content = content.substring(0, startIndex) + returnStatement + '\n}\n';
}

// Add state for theme if not present
if (!content.includes('const [theme, setTheme] = useState')) {
    content = content.replace(
        'const [sidebarOpen, setSidebarOpen] = useState(false);',
        'const [sidebarOpen, setSidebarOpen] = useState(false);\n    const [theme, setTheme] = useState("light");'
    );
}

fs.writeFileSync('page.tsx', content);
