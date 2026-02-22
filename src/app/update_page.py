import re

with open('page.tsx', 'r') as f:
    content = f.read()

# 1. Add lucide icons
content = content.replace(
    'import { Paperclip, ArrowUp } from "lucide-react";',
    'import { Paperclip, ArrowUp, X, Menu, Trash2, Plus } from "lucide-react";'
)

# 2. Add full state
state_search = r'const \[sessionId\] = useState\(\(\) => Date\.now\(\)\.toString\(\)\);'
state_repl = '''const [sessionId, setSessionId] = useState(() => Date.now().toString());
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sessions, setSessions] = useState<{id: string, title: string}[]>([]);'''
content = re.sub(state_search, state_repl, content)

# 3. Handle effect scroll logic safely.
scroll_hook = r'bottomRef\.current\?\.scrollIntoView\(\{ behavior: "smooth" \}\);\n    \}, \[messages\]\);'
load_session_block = '''bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadSessions = async () => {
        const tk = localStorage.getItem("hirekit_token");
        if (!tk) return;
        try {
            const res = await fetch(`${API_URL}/api/chat/sessions`, { headers: { Authorization: `Bearer ${tk}` } });
            const data = await res.json();
            if (data.sessions) setSessions(data.sessions);
        } catch (e) {}
    };

    const loadSession = async (id: string) => {
        const tk = localStorage.getItem("hirekit_token");
        if (!tk) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/chat/history/${id}`, { headers: { Authorization: `Bearer ${tk}` } });
            const data = await res.json();
            if (data.history) {
                setSessionId(id);
                setMessages(data.history.map((h: any) => ({
                    id: h.id || Date.now().toString(), role: h.role, content: h.content, action: "NONE"
                })));
            }
        } catch (err) {}
        setLoading(false);
        setSidebarOpen(false);
    };

    const deleteChat = async () => {
        const tk = localStorage.getItem("hirekit_token");
        if (!tk) return;
        try {
            await fetch(`${API_URL}/api/chat/history/${sessionId}`, { method: "DELETE", headers: { Authorization: `Bearer ${tk}` } });
            setMessages([]);
            setSessionId(Date.now().toString());
            loadSessions();
        } catch (e) {}
    };'''
content = content.replace('bottomRef.current?.scrollIntoView({ behavior: "smooth" });\n    }, [messages]);', load_session_block)


# 4. Handle Send & Upload File Logic
send_search = r'const send = async \(text\?: string\) => \{[\s\S]*?catch \(err\) \{[^}]+}\s*setLoading\(false\);\s*\};'
upload_search = r'const handleUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?fileInputRef\.current\.value = "";\s*\};'

send_repl = '''const send = async (text?: string) => {
        const msg = (text || input).trim();
        if ((!msg && !selectedFile) || loading || uploading) return;

        setInput("");
        setLoading(true);

        const currentFile = selectedFile;
        setSelectedFile(null); // Clear preview

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const tk = localStorage.getItem("hirekit_token");
        if (tk) headers["Authorization"] = `Bearer ${tk}`;

        try {
            let uploadedData: any = null;

            if (currentFile) {
                setUploading(true);
                const formData = new FormData();
                formData.append("file", currentFile);
                
                const uploadUserMsg: ChatMessage = {
                    id: Date.now().toString() + "_file",
                    role: "user",
                    content: `📎 Attached: ${currentFile.name}`,
                };
                setMessages((prev) => [...prev, uploadUserMsg]);

                const uploadRes = await fetch(`${API_URL}/api/upload`, { method: "POST", body: formData });
                if (!uploadRes.ok) throw new Error(await uploadRes.text());
                uploadedData = await uploadRes.json();
                setUploading(false);
            }

            if (msg) {
                const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: msg };
                setMessages((prev) => [...prev, userMsg]);
            }

            const apiMsgData = msg;
            let aiPayloadMessage = apiMsgData;
            if (uploadedData) {
                const fileContext = `I uploaded "${uploadedData.name}". Content:\\n${(uploadedData.text as string).slice(0, 3000)}`;
                aiPayloadMessage = apiMsgData ? `${apiMsgData}\\n\\n[Attached File Context]\\n${fileContext}` : fileContext;
            }

            const res = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    message: aiPayloadMessage || "Read the attached file.",
                    history: messages.map((m) => ({ role: m.role, content: m.content })),
                    email: user?.email,
                    sessionId,
                }),
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.message,
                action: data.action,
                result: data.result,
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Something went wrong. ${(err as Error).message}`,
                action: "NONE",
            }]);
            setUploading(false);
        }
        setLoading(false);
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setSelectedFile(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };'''

content_no_send = re.sub(send_search, "", content)
content = re.sub(upload_search, send_repl, content_no_send)

# 5. Handle Header
header_search = r'<div style={{ display: "flex", alignItems: "center", gap: 10 }}>\s*<img src="/logo\.png" alt="HireKit" style={{ width: 28, height: 28 }} />\s*<span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>HireKit</span>\s*</div>\s*<div style={{ display: "flex", alignItems: "center", gap: 12 }}>'
header_repl = '''<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => { loadSessions(); setSidebarOpen(true); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#666" }}>
                        <Menu size={20} />
                    </button>
                    <img src="/logo.png" alt="HireKit" style={{ width: 28, height: 28 }} />
                    <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>HireKit</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {messages.length > 0 && (
                        <button onClick={deleteChat} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", marginRight: 10 }} title="Clear Chat">
                            <Trash2 size={18} />
                            <span style={{ fontSize: 13, marginLeft: 6, fontWeight: 500 }}>Clear</span>
                        </button>
                    )}'''
content = content.replace('<div style={{ display: "flex", alignItems: "center", gap: 10 }}>\n                    <img src="/logo.png" alt="HireKit" style={{ width: 28, height: 28 }} />\n                    <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>HireKit</span>\n                </div>\n                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>', header_repl)

# 6. Sidebar Implementation + Main Wrapper changes
main_wrap_search = r'<div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#fff" }}>'
main_wrap_repl = '''<div style={{ display: "flex", height: "100vh", background: "#fff", position: "relative", overflow: "hidden" }}>
            {sidebarOpen && (
                <>
                    <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 260, background: "#f9f9f9", zIndex: 10, borderRight: "1px solid #eee", display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>Chats</span>
                            <div style={{ display: "flex", gap: 12 }}>
                                <button onClick={() => { setSessionId(Date.now().toString()); setMessages([]); setSidebarOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }} title="New Chat"><Plus size={18} /></button>
                                <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={18} /></button>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                            {sessions.length === 0 && <div style={{ fontSize: 13, color: "#888", textAlign: "center", marginTop: 20 }}>No past chats</div>}
                            {sessions.map(s => (
                                <div key={s.id} style={{ display: "flex", alignItems: "center", marginBottom: 4, borderRadius: 8, padding: "8px 12px", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="#f0f0f0"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                                    <button onClick={() => loadSession(s.id)} style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div onClick={() => setSidebarOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 9 }} />
                </>
            )}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>'''
content = content.replace('<div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#fff" }}>', main_wrap_repl)

footer_wrapper_search = r'HireKit can make mistakes\. Verify important information\.\n                </p>\n            </div>\n        </div>'
footer_wrapper_repl = '''HireKit can make mistakes. Verify important information.
                </p>
            </div>
        </div>
        </div>'''
content = re.sub(r'HireKit can make mistakes\. Verify important information\.\s*</p>\s*</div>\s*</div>', footer_wrapper_repl, content)

# 7. Input Box UI updates
input_box_search = r'<div style=\{\{\n\s*maxWidth: 640,\s*margin: "0 auto",\n\s*display: "flex", alignItems: "flex-end",\n\s*border: "1px solid #d9d9d9", borderRadius: 24,\n\s*padding: "4px 6px 4px 10px", background: "#fff",\n\s*boxShadow: "0 1px 6px rgba\(0,0,0,0\.05\)",\n\s*\}\}>[\s\S]*?</div>\s*<p style=\{\{ textAlign: "center"'

input_box_repl = '''<div style={{
                        maxWidth: 640, margin: "0 auto",
                    }}>
                        {selectedFile && (
                            <div style={{
                                padding: "8px 12px", background: "#f9f9f9", borderRadius: 12, marginBottom: 8,
                                display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #eee",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ padding: 6, background: "#fff", borderRadius: 8, border: "1px solid #e5e5e5" }}>
                                        <Paperclip size={14} color="#666" />
                                    </div>
                                    <span style={{ fontSize: 13, color: "#333", fontWeight: 500, maxWidth: 200, WebkitLineClamp: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{selectedFile.name}</span>
                                </div>
                                <button onClick={() => setSelectedFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" }}>
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div style={{
                            display: "flex", alignItems: "center",
                            border: "1px solid #d9d9d9", borderRadius: 24,
                            padding: "4px 6px 4px 10px", background: "#fff",
                            boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                        }}>
                            <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md" onChange={handleUpload} style={{ display: "none" }} />
                            <button onClick={() => fileInputRef.current?.click()} disabled={uploading || loading} style={{
                                width: 32, height: 32, borderRadius: "50%", background: "transparent", border: "none",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                opacity: uploading ? 0.4 : 0.6, transition: "opacity 0.15s",
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
                                title="Upload resume or document"
                            >
                                <Paperclip size={18} color="#666" strokeWidth={2} />
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
                                    fontSize: 15, padding: "8px 0 8px 8px", lineHeight: 1.5,
                                    maxHeight: 150, fontFamily: "inherit", background: "transparent", color: "#111",
                                }}
                            />

                            <button onClick={() => send()} disabled={(!input.trim() && !selectedFile) || loading || uploading} style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: (input.trim() || selectedFile) && !loading ? "#000" : "#e5e5e5",
                                border: "none", cursor: (input.trim() || selectedFile) && !loading ? "pointer" : "default",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background 0.15s",
                            }}>
                                <ArrowUp size={16} strokeWidth={2.5} color={(input.trim() || selectedFile) && !loading ? "#fff" : "#999"} />
                            </button>
                        </div>
                    </div>
                    <p style={{ textAlign: "center"'''

content = re.sub(input_box_search, input_box_repl, content)


with open('page.tsx', 'w') as f:
    f.write(content)

