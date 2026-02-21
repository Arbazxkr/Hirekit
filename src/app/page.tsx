"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    const [sessionId] = useState(() => Date.now().toString());
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

    // Send message
    const send = async (text?: string) => {
        const msg = (text || input).trim();
        if (!msg || loading) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: msg };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: msg,
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
        }
        setLoading(false);
    };

    // File upload
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`${API_URL}/api/upload`, { method: "POST", body: formData });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            const userMsg: ChatMessage = {
                id: Date.now().toString(),
                role: "user",
                content: `📎 Uploaded: ${data.name}`,
            };
            setMessages((prev) => [...prev, userMsg]);

            // Send to AI
            setLoading(true);
            const chatRes = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `I uploaded "${data.name}". Content:\n${(data.text as string).slice(0, 3000)}`,
                    history: messages.map((m) => ({ role: m.role, content: m.content })),
                    email: user?.email,
                    sessionId,
                }),
            });
            const chatData = await chatRes.json();
            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: chatData.message,
                action: chatData.action,
                result: chatData.result,
            }]);
        } catch (err) {
            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Failed to process file. ${(err as Error).message}`,
            }]);
        }

        setUploading(false);
        setLoading(false);
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
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#fff" }}>
            {/* Header */}
            <header style={{
                padding: "10px 20px", borderBottom: "1px solid #eee",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src="/logo.png" alt="HireKit" style={{ width: 28, height: 28 }} />
                    <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>HireKit</span>
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
                            <div style={{ padding: "10px 14px", background: "#f4f4f4", borderRadius: 16, fontSize: 14 }}>
                                <span className="dot-pulse">⏳ Thinking...</span>
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
                    display: "flex", alignItems: "flex-end",
                    border: "1px solid #d9d9d9", borderRadius: 24,
                    padding: "4px 6px 4px 10px", background: "#fff",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                }}>
                    {/* Upload */}
                    <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md" onChange={handleUpload} style={{ display: "none" }} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading || loading} style={{
                        width: 32, height: 32, borderRadius: "50%", background: "transparent", border: "none",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: 2, opacity: uploading ? 0.4 : 0.6, transition: "opacity 0.15s",
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
                        title="Upload resume or document"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        }}
                    />

                    <button onClick={() => send()} disabled={!input.trim() || loading || uploading} style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: input.trim() && !loading ? "#000" : "#e5e5e5",
                        border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.15s", marginBottom: 2,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? "#fff" : "#999"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
    );
}
