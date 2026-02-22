"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Paperclip, ArrowUp, X, Menu, Trash2, Plus } from "lucide-react";
import { ResumePreview } from "@/components/ResumePreview";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    action?: string;
    result?: Record<string, unknown>;
}

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    salary_min?: number;
    salary_max?: number;
    description: string;
    url: string;
}

interface Application {
    id: string;
    job_title: string;
    company: string;
    status: string;
    applied_at: string;
    job_url: string;
}

interface PlanSummary {
    plan: string;
    today: {
        chats: { used: number; limit: number };
        applies: { used: number; limit: number };
        resumes: { used: number; limit: number };
        uploads: { used: number; limit: number };
    };
}

const TypingIndicator = () => (
    <div style={{ display: "flex", gap: "4px", padding: "4px 2px", alignItems: "center", height: "100%" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#888", animation: "pulse 1.5s infinite ease-in-out" }} />
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#888", animation: "pulse 1.5s infinite ease-in-out 0.2s" }} />
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#888", animation: "pulse 1.5s infinite ease-in-out 0.4s" }} />
        <style>{`
            @keyframes pulse {
                0%, 100% { opacity: 0.4; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.2); }
            }
        `}</style>
    </div>
);

const renderMessageContent = (content: string) => {
    if (content.startsWith("📎 Attached: ")) {
        const filename = content.replace("📎 Attached: ", "");
        return (
            <div style={{
                padding: "8px 12px", background: "rgba(255,255,255,0.1)", borderRadius: 12,
                display: "inline-flex", alignItems: "center", gap: 8,
                border: "1px solid rgba(255,255,255,0.2)"
            }}>
                <Paperclip size={14} color="#bbb" />
                <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{filename}</span>
            </div>
        );
    }

    if (content.includes("[Attached File Context]")) {
        const parts = content.split("\n\n[Attached File Context]\n");
        const userText = parts[0].trim();
        const fileDetail = parts.length > 1 ? parts[1] : parts[0];

        let filename = "document";
        const match = fileDetail.match(/I uploaded "(.*)"\. Content:/);
        if (match) filename = match[1];

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                {userText && userText !== fileDetail && <div style={{ whiteSpace: "pre-wrap" }}>{userText}</div>}
                <div style={{
                    padding: "8px 12px", background: "rgba(255,255,255,0.1)", borderRadius: 12,
                    display: "inline-flex", alignItems: "center", gap: 8,
                    border: "1px solid rgba(255,255,255,0.2)"
                }}>
                    <Paperclip size={14} color="#bbb" />
                    <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{filename}</span>
                </div>
            </div>
        );
    }

    if (content.startsWith('I uploaded "') && content.includes('". Content:\n')) {
        const match = content.match(/I uploaded "(.*)"\. Content:/);
        const filename = match ? match[1] : "document";
        return (
            <div style={{
                padding: "8px 12px", background: "rgba(255,255,255,0.1)", borderRadius: 12,
                display: "inline-flex", alignItems: "center", gap: 8,
                border: "1px solid rgba(255,255,255,0.2)"
            }}>
                <Paperclip size={14} color="#bbb" />
                <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{filename}</span>
            </div>
        );
    }
    return content;
};

export default function Home() {

    return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>}>
            <HomeInner />
        </Suspense>
    );
}

function HomeInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<Record<string, string> | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [sessionId, setSessionId] = useState(() => Date.now().toString());
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sessions, setSessions] = useState<{ id: string, title: string }[]>([]);
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

    const filteredSessions = sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check auth
    useEffect(() => {
        const stored = localStorage.getItem("hirekit_user");
        if (!stored) {
            router.push("/login");
            return;
        }
        const u = JSON.parse(stored);
        setUser(u);

        // Welcome message
        const upgraded = searchParams.get("upgraded");
        const welcome: ChatMessage = upgraded
            ? {
                id: "welcome",
                role: "assistant",
                content: `🎉 Welcome to Pro! You now have:\n✅ 100 chats/day\n✅ 20 auto-applies/day\n✅ All locations (India + Gulf + Remote)\nWhat would you like to do first?`,
                action: "NONE",
            }
            : {
                id: "welcome",
                role: "assistant",
                content: `👋 Hi ${u.name?.split(" ")[0] || "there"}! I'm HireKit AI.\nTell me about yourself — your profession, experience, and where you want to work.\nI'll find you jobs and apply automatically!`,
                action: "NONE",
            };
        setMessages([welcome]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadSessions = async () => {
        const tk = localStorage.getItem("hirekit_token");
        if (!tk) return;
        try {
            const res = await fetch(`${API_URL}/api/chat/sessions`, { headers: { Authorization: `Bearer ${tk}` } });
            const data = await res.json();
            if (data.sessions) setSessions(data.sessions);
        } catch (e) { }
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
        } catch (err) { }
        setLoading(false);
        setSidebarOpen(false);
    };

    const deleteChat = async (idToDelete: string) => {
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

        } catch (e) { }
        setEditingChatId(null);
    };

    // File upload
    const send = async (text?: string) => {
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
                const fileContext = `I uploaded "${uploadedData.name}". Content:
${(uploadedData.text as string).slice(0, 3000)}`;
                aiPayloadMessage = apiMsgData ? `${apiMsgData}

[Attached File Context]
${fileContext}` : fileContext;
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
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const showChips = messages.length <= 1;

    // --- Render action results ---
    const renderResult = (msg: ChatMessage) => {
        if (!msg.action || msg.action === "NONE" || !msg.result) return null;

        switch (msg.action) {
            case "SEARCH_JOBS": {
                const jobs = (msg.result as { jobs: Job[] }).jobs || [];
                if (!jobs.length) return null;
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10, maxWidth: 500 }}>
                        {jobs.slice(0, 8).map((job) => (
                            <div key={job.id} style={{
                                border: "1px solid #e5e5e5", borderRadius: 12, padding: 14,
                                background: "#fafafa",
                            }}>
                                <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>💼 {job.title}</div>
                                <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>
                                    {job.company} • {job.location}
                                </div>
                                {job.salary_min && (
                                    <div style={{ fontSize: 13, color: "#22c55e", marginTop: 2 }}>
                                        ₹{Math.round(job.salary_min / 1000)}K - ₹{Math.round((job.salary_max || job.salary_min) / 1000)}K
                                    </div>
                                )}
                                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                    <a href={job.url} target="_blank" rel="noopener noreferrer" style={{
                                        padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                        border: "1px solid #ddd", color: "#333", textDecoration: "none", background: "#fff",
                                    }}>View Job</a>
                                    <button onClick={() => send(`Apply to ${job.url}`)} style={{
                                        padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                        border: "none", background: "#111", color: "#fff", cursor: "pointer",
                                    }}>Auto Apply</button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }

            case "BUILD_RESUME": {
                const resume = (msg.result as { resume: string }).resume;
                if (!resume) return null;
                return <ResumePreview resumeText={resume} />;
            }

            case "SCORE_RESUME": {
                const r = msg.result as { score: number; feedback: string[]; missing: string[] };
                const color = r.score >= 80 ? "#22c55e" : r.score >= 60 ? "#f59e0b" : "#ef4444";
                return (
                    <div style={{ marginTop: 10, padding: 16, border: "1px solid #e5e5e5", borderRadius: 12, background: "#fafafa", maxWidth: 400 }}>
                        <div style={{ fontSize: 48, fontWeight: 800, color, textAlign: "center" }}>{r.score}</div>
                        <div style={{ textAlign: "center", fontSize: 13, color: "#888", marginBottom: 12 }}>ATS Score out of 100</div>
                        {r.feedback?.length > 0 && (
                            <div style={{ fontSize: 13, color: "#333" }}>
                                <strong>Feedback:</strong>
                                <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
                                    {r.feedback.map((f, i) => <li key={i}>{f}</li>)}
                                </ul>
                            </div>
                        )}
                        {r.missing?.length > 0 && (
                            <div style={{ fontSize: 13, color: "#ef4444", marginTop: 8 }}>
                                <strong>Missing keywords:</strong> {r.missing.join(", ")}
                            </div>
                        )}
                    </div>
                );
            }

            case "AUTO_APPLY": {
                const r = msg.result as { success: boolean; message: string };
                return (
                    <div style={{
                        marginTop: 10, padding: 12, borderRadius: 10,
                        background: r.success ? "#f0fdf4" : "#fef2f2",
                        border: `1px solid ${r.success ? "#bbf7d0" : "#fecaca"}`,
                        fontSize: 13,
                    }}>
                        {r.success ? "✅" : "❌"} {r.message}
                    </div>
                );
            }

            case "SHOW_APPLICATIONS": {
                const apps = (msg.result as { applications: Application[] }).applications || [];
                if (!apps.length) return <div style={{ fontSize: 13, color: "#888", marginTop: 8 }}>No applications yet.</div>;
                return (
                    <div style={{ marginTop: 10, overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
                                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#888" }}>Job</th>
                                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#888" }}>Company</th>
                                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#888" }}>Status</th>
                                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#888" }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {apps.map((app) => {
                                    const statusColors: Record<string, string> = {
                                        applied: "#3b82f6", interview: "#f59e0b", rejected: "#ef4444",
                                        offer: "#22c55e", pending: "#888",
                                    };
                                    return (
                                        <tr key={app.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                            <td style={{ padding: "8px" }}>{app.job_title}</td>
                                            <td style={{ padding: "8px" }}>{app.company}</td>
                                            <td style={{ padding: "8px" }}>
                                                <span style={{
                                                    padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                                                    background: statusColors[app.status] || "#888", color: "#fff",
                                                }}>{app.status}</span>
                                            </td>
                                            <td style={{ padding: "8px", color: "#888" }}>
                                                {new Date(app.applied_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            }

            case "SHOW_PLAN": {
                const r = msg.result as unknown as PlanSummary;
                if (!r?.plan) return null;
                const planColors: Record<string, string> = { free: "#888", pro: "#3b82f6", premium: "#8b5cf6" };
                return (
                    <div style={{
                        marginTop: 10, padding: 16, border: "1px solid #e5e5e5", borderRadius: 12,
                        background: "#fafafa", maxWidth: 320,
                    }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: planColors[r.plan] || "#333", marginBottom: 10 }}>
                            Your Plan: {r.plan.toUpperCase()}
                        </div>
                        {r.today && (
                            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.8 }}>
                                Chats: {r.today.chats.used}/{r.today.chats.limit === -1 ? "∞" : r.today.chats.limit} today<br />
                                Applies: {r.today.applies.used}/{r.today.applies.limit === -1 ? "∞" : r.today.applies.limit} today<br />
                                Resumes: {r.today.resumes.used}/{r.today.resumes.limit === -1 ? "∞" : r.today.resumes.limit} today
                            </div>
                        )}
                        {r.plan === "free" && (
                            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                <button onClick={() => handleUpgrade("pro")} style={{
                                    padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer",
                                }}>Upgrade Pro ₹499</button>
                                <button onClick={() => handleUpgrade("premium")} style={{
                                    padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    border: "none", background: "#8b5cf6", color: "#fff", cursor: "pointer",
                                }}>Premium ₹999</button>
                            </div>
                        )}
                    </div>
                );
            }

            case "SAVE_PROFILE":
                return (
                    <div style={{
                        marginTop: 8, padding: "6px 12px", borderRadius: 8,
                        background: "#f0fdf4", border: "1px solid #bbf7d0",
                        fontSize: 12, color: "#166534", display: "inline-block",
                    }}>
                        ✅ Profile saved!
                    </div>
                );

            default:
                return null;
        }
    };

    const handleUpgrade = async (plan: string) => {
        try {
            const res = await fetch(`${API_URL}/api/subscription/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, email: user?.email }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (err) {
            console.error("Upgrade error:", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("hirekit_user");
        localStorage.removeItem("hirekit_token");
        router.push("/login");
    };

    if (!user) return null;

    return (
        <div style={{ display: "flex", height: "100vh", background: "#fff", position: "relative", overflow: "hidden" }}>
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
                                <div key={s.id} style={{ display: "flex", alignItems: "center", marginBottom: 4, borderRadius: 8, padding: "8px 12px", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <button onClick={() => loadSession(s.id)} style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div onClick={() => setSidebarOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 9 }} />
                </>
            )}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
                {/* Header */}
                <header style={{
                    padding: "10px 20px", borderBottom: "1px solid #eee",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={() => { loadSessions(); setSidebarOpen(true); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#666" }}>
                            <Menu size={20} />
                        </button>
                        <img src="/logo.png" alt="HireKit" style={{ width: 28, height: 28 }} />
                        <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>HireKit</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {messages.length > 0 && (
                            <button onClick={() => deleteChat(sessionId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", marginRight: 10 }} title="Clear Chat">
                                <Trash2 size={18} />
                                <span style={{ fontSize: 13, marginLeft: 6, fontWeight: 500 }}>Clear</span>
                            </button>
                        )}
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

                {/* Messages */}
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
                                    }}>
                                        {msg.content}
                                    </div>
                                    {msg.role === "assistant" && renderResult(msg)}
                                </div>
                            </div>
                        ))}

                        {/* Loading */}
                        {loading && (
                            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                                <img src="/logo.png" alt="AI" style={{ width: 28, height: 28 }} />
                                <div style={{ padding: "12px 16px", background: "#f4f4f4", borderRadius: 16, display: "flex", alignItems: "center" }}>
                                    <TypingIndicator />
                                </div>
                            </div>
                        )}

                        {/* Suggestion chips */}
                        {showChips && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, justifyContent: "center" }}>
                                {["I'm a software developer", "Looking for Gulf jobs", "Help me build a resume", "What can you do?"].map((chip) => (
                                    <button key={chip} onClick={() => send(chip)} style={{
                                        padding: "8px 16px", borderRadius: 20, border: "1px solid #ddd",
                                        background: "#fff", fontSize: 13, cursor: "pointer", color: "#555",
                                        transition: "all 0.15s",
                                    }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; e.currentTarget.style.borderColor = "#bbb"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#ddd"; }}
                                    >{chip}</button>
                                ))}
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>
                </main>

                {/* Input */}
                <div style={{ padding: "12px 16px 20px", borderTop: "1px solid #f0f0f0" }}>
                    <div style={{
                        maxWidth: 640, margin: "0 auto",
                    }}>
                        {selectedFile && (
                            <div style={{
                                padding: "8px 12px", background: "#f9f9f9", borderRadius: 12, marginBottom: 8,
                                display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #eee",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {selectedFile.type.startsWith("image/") ? (
                                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6, border: "1px solid #ddd" }} />
                                    ) : (
                                        <div style={{ padding: 6, background: "#fff", borderRadius: 8, border: "1px solid #e5e5e5" }}>
                                            <Paperclip size={14} color="#666" />
                                        </div>
                                    )}
                                    <span style={{ fontSize: 13, color: "#333", fontWeight: 500, maxWidth: 200, WebkitLineClamp: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{selectedFile.name}</span>
                                </div>
                                <button onClick={() => setSelectedFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" }}>
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center", alignContent: "center",
                            border: "1px solid #d9d9d9", borderRadius: 24,
                            padding: "4px 6px 4px 10px", background: "#fff",
                            boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                        }}>
                            <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md" onChange={handleUpload} style={{ display: "none" }} />
                            <button onClick={() => fileInputRef.current?.click()} disabled={uploading || loading} style={{
                                width: 32, height: 32, borderRadius: "50%", background: "transparent", border: "none",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                opacity: uploading ? 0.4 : 0.6, transition: "opacity 0.15s", marginBottom: 2,
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
                                title="Upload resume or document"
                            >
                                <Plus size={20} color="#666" strokeWidth={2} />
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
                                    fontSize: 15, padding: "10px 0 10px 8px", lineHeight: 1.5,
                                    maxHeight: 150, fontFamily: "inherit", background: "transparent", color: "#111",
                                }}
                            />

                            <button onClick={() => send()} disabled={(!input.trim() && !selectedFile) || loading || uploading} style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: (input.trim() || selectedFile) && !loading ? "#000" : "#e5e5e5",
                                border: "none", cursor: (input.trim() || selectedFile) && !loading ? "pointer" : "default",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background 0.15s", marginBottom: 2,
                            }}>
                                <ArrowUp size={16} strokeWidth={2.5} color={(input.trim() || selectedFile) && !loading ? "#fff" : "#999"} />
                            </button>
                        </div>
                    </div>
                    <p style={{ textAlign: "center", fontSize: 11, color: "#aaa", marginTop: 8 }}>
                        HireKit can make mistakes. Verify important information.
                    </p>
                </div>
            </div>
        </div>
    );
}
