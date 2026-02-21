"use client";

import type { UserProfile } from "@/app/page";

export function Sidebar({ isOpen, onToggle, profile }: { isOpen: boolean; onToggle: () => void; profile: UserProfile }) {
    return (
        <>
            {/* Toggle */}
            <button onClick={onToggle} style={{
                position: "fixed", top: 14, left: isOpen ? 244 : 14, zIndex: 50,
                background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
                padding: "6px 10px", cursor: "pointer", color: "var(--text-secondary)",
                transition: "left 0.3s", fontSize: 16, lineHeight: 1,
            }}>
                {isOpen ? "✕" : "☰"}
            </button>

            <aside style={{
                width: 240, height: "100vh", padding: "48px 14px 14px",
                display: "flex", flexDirection: "column", gap: 16,
                borderRight: "1px solid var(--border)", background: "var(--bg-secondary)",
                transform: isOpen ? "translateX(0)" : "translateX(-260px)",
                transition: "transform 0.3s", position: "fixed", left: 0, top: 0, zIndex: 40,
            }}>
                {/* Logo */}
                <div style={{ padding: "0 4px" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700 }}>HireKit</h2>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>AI Job Assistant</p>
                </div>

                {/* Profile */}
                <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 600, fontSize: 14 }}>
                            {profile.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{profile.name || "User"}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{profile.location}</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {profile.skills.slice(0, 3).map(s => (
                            <span key={s} className="chip">{s}</span>
                        ))}
                        {profile.skills.length > 3 && <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "4px 0" }}>+{profile.skills.length - 3}</span>}
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                    {[
                        { icon: "💬", label: "Chat", active: true },
                        { icon: "📄", label: "Resumes", active: false },
                        { icon: "📋", label: "Applications", active: false },
                        { icon: "🔍", label: "Find Jobs", active: false },
                    ].map(item => (
                        <button key={item.label} style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                            borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                            background: item.active ? "var(--accent-light)" : "transparent",
                            color: item.active ? "var(--accent)" : "var(--text-secondary)",
                            fontWeight: item.active ? 600 : 400, textAlign: "left",
                        }}>
                            <span>{item.icon}</span> {item.label}
                        </button>
                    ))}
                </nav>

                {/* Settings */}
                <button style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                    borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
                    background: "transparent", color: "var(--text-muted)", fontFamily: "inherit", textAlign: "left",
                }}>
                    ⚙️ Settings
                </button>
            </aside>
        </>
    );
}
