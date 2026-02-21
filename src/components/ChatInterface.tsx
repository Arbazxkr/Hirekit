"use client";

import { useState, useRef, useEffect } from "react";
import type { UserProfile } from "@/app/page";

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

const SUGGESTIONS = [
    "🔍 Find frontend developer jobs",
    "📄 Build my resume for a React role",
    "💡 Review and improve my resume",
    "🎤 Prepare me for an interview",
];

export function ChatInterface({ profile, sidebarOpen }: { profile: UserProfile; sidebarOpen: boolean }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = async (text?: string) => {
        const msg = (text || input).trim();
        if (!msg || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg, profile, history: messages.slice(-10) }),
            });

            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: `Something went wrong. Please try again.\n\n${(err as Error).message}` }]);
        }

        setLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    };

    return (
        <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", marginLeft: sidebarOpen ? 240 : 0, transition: "margin-left 0.3s" }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
                <div style={{ maxWidth: 680, margin: "0 auto" }}>
                    {messages.length === 0 ? (
                        <div className="animate-in" style={{ textAlign: "center", paddingTop: "18vh" }}>
                            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>
                                Hey {profile.name?.split(" ")[0] || "there"} 👋
                            </h2>
                            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 28 }}>
                                I can find jobs, build your resume, and prepare you for interviews
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 400, margin: "0 auto" }}>
                                {SUGGESTIONS.map(s => (
                                    <button key={s} className="btn-secondary" onClick={() => send(s)} style={{ fontSize: 12, padding: "12px 14px", textAlign: "left" }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.id} className="animate-in" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                                    background: msg.role === "user" ? "var(--accent)" : "var(--success)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "white", fontSize: 12, fontWeight: 600,
                                }}>
                                    {msg.role === "user" ? profile.name?.charAt(0)?.toUpperCase() || "U" : "H"}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 3 }}>
                                        {msg.role === "user" ? "You" : "HireKit"}
                                    </div>
                                    <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {loading && (
                        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 600 }}>H</div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>HireKit</div>
                                <div style={{ display: "flex", gap: 4 }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} className="loading-dot" style={{ animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Input */}
            <div style={{ padding: "12px 20px 20px" }}>
                <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "flex-end", gap: 8, padding: 8, border: "1px solid var(--border)", borderRadius: 14, background: "var(--bg)" }}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything — find jobs, build resume, prep for interview..."
                        rows={1}
                        style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 14, padding: "8px 10px", lineHeight: 1.5, maxHeight: 120, fontFamily: "inherit", background: "transparent" }}
                    />
                    <button className="btn-primary" onClick={() => send()} disabled={!input.trim() || loading} style={{ padding: "8px 12px", borderRadius: 8, minWidth: 36, fontSize: 16 }}>
                        ↑
                    </button>
                </div>
                <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                    HireKit can make mistakes. Verify important info.
                </p>
            </div>
        </main>
    );
}
