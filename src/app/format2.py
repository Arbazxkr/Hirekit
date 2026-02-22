import re

with open('page.tsx', 'r') as f:
    text = f.read()

# Fix centering
search = r'''<div style=\{\{\s*display: "flex", alignItems: "center",\s*border: "1px solid #d9d9d9", borderRadius: 24,'''
replace = '''<div style={{
                            display: "flex", alignItems: "center", justifyContent: "center", alignContent: "center",
                            border: "1px solid #d9d9d9", borderRadius: 24,'''
text = re.sub(search, replace, text)

# Fix edit title chat feature. Replace the sessions.map block in the Sidebar with an interactive one.
search_map = r'\{filteredSessions\.map\(s => \(\s*<div key=\{s\.id\} style=\{\{ display: "flex", alignItems: "center", marginBottom: 4, borderRadius: 8, padding: "8px 12px", transition: "background 0\.2s" \}\} onMouseEnter=\{e => e\.currentTarget\.style\.background = "#f0f0f0"\} onMouseLeave=\{e => e\.currentTarget\.style\.background = "transparent"\}\>\s*<button onClick=\{.*?\}\s*</button>\s*</div>\s*\)\)\}'

replace_map = '''{filteredSessions.map(s => (
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
                            ))}'''

text = re.sub(search_map, replace_map, text)

# Add editingChatId state
state_search = r'const \[searchQuery, setSearchQuery\] = useState\(""\);'
state_repl = '''const [searchQuery, setSearchQuery] = useState("");
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editChatName, setEditChatName] = useState("");'''
text = text.replace(state_search, state_repl)

# Refactor deleteChat to take an ID and add rename function
del_search = r'''const deleteChat = async \(\) => \{\s*const tk = localStorage\.getItem\("hirekit_token"\);\s*if \(\!tk\) return;\s*try \{\s*await fetch\(`\$\{API_URL\}/api/chat/history/\$\{sessionId\}`.*?\);\s*setMessages\(\[\]\);\s*setSessionId\(Date\.now\(\)\.toString\(\)\);\s*loadSessions\(\);\s*\} catch \(e\) \{ \}\s*\};'''

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

text = re.sub(del_search, del_repl, text)

with open('page.tsx', 'w') as f:
    f.write(text)

