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
                                <div key={s.id} style={{ display: "flex", alignItems: "center", marginBottom: 4, borderRadius: 8, padding: "8px 12px", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <button onClick={() => loadSession(s.id)} style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</button>
                                </div>
                            ))}
                        </div>
'''

target_sidebar_scroll_area = r'<div style=\{\{ flex: 1, overflowY: "auto", padding: 12 \}\}>\s*\{sessions\.length === 0 \&\& <div.*?</div>\}\s*\{sessions\.map\(s => \(\s*<div key=\{s\.id\}.*?</div>\s*\)\)\}\s*</div>'
original = re.sub(target_sidebar_scroll_area, chatgpt_sidebar_search_html, original)

# Add edit state items
states_search = r'const \[sessions, setSessions\] = useState<\{id: string, title: string\}\[]>\[\]\);'
states_repl = '''const [sessions, setSessions] = useState<{id: string, title: string}[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

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

original = original.replace('const [sessions, setSessions] = useState<{id: string, title: string}[]>([]);', states_repl)


# Fix the input block centering. 
input_box_search = r'<div style=\{\{\s*display: "flex", alignItems: "flex-end",\s*border: "1px solid #d9d9d9", borderRadius: 24,'
input_box_repl = '''<div style={{
                            display: "flex", alignItems: "center",
                            border: "1px solid #d9d9d9", borderRadius: 24,'''
original = re.sub(input_box_search, input_box_repl, original)

input_box_btn1_search = r'opacity: uploading \? 0\.4 : 0\.6, transition: "opacity 0\.15s", marginBottom: 2,'
input_box_btn1_repl = 'opacity: uploading ? 0.4 : 0.6, transition: "opacity 0.15s",'
original = original.replace(input_box_btn1_search, input_box_btn1_repl)

input_box_btn2_search = r'transition: "background 0\.15s", marginBottom: 2,'
input_box_btn2_repl = 'transition: "background 0.15s",'
original = original.replace(input_box_btn2_search, input_box_btn2_repl)


with open('src/app/page.tsx', 'w') as f:
    f.write(original)

