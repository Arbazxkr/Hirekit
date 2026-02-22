import re

with open('src/app/page.tsx', 'r') as f:
    original = f.read()

# Make search chat UI inside the sidebar map area 
chatgpt_sidebar_search_html = '''
<div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                            {/* Search Box / New Chat Box Area */}
                            <div style={{ padding: "0 4px", position: "relative" }}>
                                <input 
                                    placeholder="Search chats..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ 
                                        width: "100%", padding: "8px 12px 8px 32px", fontSize: 13, 
                                        borderRadius: 8, border: "1px solid #ddd", 
                                        outline: "none", boxSizing: "border-box", marginBottom: 16
                                    }} 
                                />
                                <svg style={{ position: "absolute", left: 14, top: 10 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                
                                <div style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 8, paddingLeft: 4 }}>PAST CHATS</div>
                            </div>

                            {filteredSessions.length === 0 && <div style={{ fontSize: 13, color: "#888", textAlign: "center", marginTop: 20 }}>No past chats</div>}
                            {filteredSessions.map(s => (
                                <div key={s.id} 
                                     style={{ display: "flex", alignItems: "center", marginBottom: 4, borderRadius: 8, padding: "8px 12px", transition: "background 0.2s", background: s.id === sessionId ? "#f0f0f0" : "transparent" }} 
                                     onMouseEnter={e => { if(s.id !== sessionId) e.currentTarget.style.background = "#f4f4f4"; }} 
                                     onMouseLeave={e => { if(s.id !== sessionId) e.currentTarget.style.background = "transparent"; }}
                                     onClick={() => loadSession(s.id)}
                                >
                                    {editingChatId === s.id ? (
                                        <input 
                                            autoFocus
                                            value={editChatName}
                                            onChange={(e) => setEditChatName(e.target.value)}
                                            onBlur={() => saveChatRename(s.id)}
                                            onKeyDown={(e) => {
                                                if(e.key === "Enter") saveChatRename(s.id);
                                                if(e.key === "Escape") setEditingChatId(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ flex: 1, fontSize: 13, padding: "2px 6px", border: "1px solid #3b82f6", borderRadius: 4, outline: "none" }}
                                        />
                                    ) : (
                                        <div style={{ flex: 1, overflow: "hidden", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <span style={{ fontSize: 13, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</span>
                                            
                                            <div style={{ display: "flex", gap: 4, opacity: s.id === sessionId ? 1 : 0 }} className="chat-actions">
                                                <button onClick={(e) => { e.stopPropagation(); setEditChatName(s.title); setEditingChatId(s.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#888" }} title="Rename">✏️</button>
                                                <button onClick={(e) => { e.stopPropagation(); deleteChat(s.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#ef4444" }} title="Delete">✕</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
'''

target_sidebar_scroll_area = r'<div style=\{\{ flex: 1, overflowY: "auto", padding: 12 \}\}>\s*\{sessions\.length === 0 \&\& <div.*?</div>\}\s*\{sessions\.map\(s => \(\s*<div key=\{s\.id\}.*?</div>\s*\)\)\}\s*</div>'
original = re.sub(target_sidebar_scroll_area, chatgpt_sidebar_search_html, original)

# Add edit state items
states_search = 'const [sessions, setSessions] = useState<{ id: string, title: string }[]>([]);'
states_repl = '''const [sessions, setSessions] = useState<{ id: string, title: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editChatName, setEditChatName] = useState("");

    // Command K hotkey logic
    useEffect(() => {
        const handleCmdK = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                loadSessions();
                setSidebarOpen(true);
            }
        };
        document.addEventListener("keydown", handleCmdK);
        return () => document.removeEventListener("keydown", handleCmdK);
    }, []);

    const filteredSessions = sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));'''

if "searchQuery" not in original:
    original = original.replace(states_search, states_repl)


# Refactor deleteChat to take an ID and add rename function
del_search = r'''const deleteChat = async \(\).*?try \{\s*await fetch\(`\$\{API_URL\}/api/chat/history/\$\{sessionId\}`.*?\);\s*setMessages\(\[\]\);\s*setSessionId\(Date\.now\(\)\.toString\(\)\);\s*loadSessions\(\);\s*\} catch \(e\) \{ \}\s*\};'''

del_repl = '''const deleteChat = async (idToDelete: string) => {
        const tk = localStorage.getItem("hirekit_token");
        if (!tk) return;
        try {
            await fetch(`${API_URL}/api/chat/history/${idToDelete}`, { method: "DELETE", headers: { Authorization: `Bearer ${tk}` } });
            if (sessionId === idToDelete) {
                setMessages([]);
                setSessionId(Date.now().toString());
            }
            loadSessions();
        } catch (e) { }
    };

    const saveChatRename = async (idToRename: string) => {
        if (!editChatName.trim()) {
            setEditingChatId(null);
            return;
        }
        
        const tk = localStorage.getItem("hirekit_token");
        if (!tk) return;
        
        try {
            // Optimistic update
            setSessions(prev => prev.map(s => s.id === idToRename ? { ...s, title: editChatName } : s));
            
            await fetch(`${API_URL}/api/chat/rename`, { 
                method: "PUT", 
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
                body: JSON.stringify({ sessionId: idToRename, title: editChatName })
            });
            
        } catch (e) {}
        setEditingChatId(null);
    };'''

if "saveChatRename" not in original:
    original = re.sub(del_search, del_repl, original, flags=re.DOTALL)


with open('src/app/page.tsx', 'w') as f:
    f.write(original)

