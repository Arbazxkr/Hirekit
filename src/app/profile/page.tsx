"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Briefcase, FileText } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Profile {
    email: string;
    name: string;
    skills: string[];
    experience: string;
    education: string;
    location: string;
    target_role: string;
    resume_text?: string;
    username?: string;
    avatar_url?: string;
}

interface Resume {
    id: string;
    job_title: string;
    resume_text: string;
    created_at: string;
}

interface Application {
    id: string;
    job_title: string;
    company: string;
    status: string;
    applied_at: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<Record<string, string> | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [plan, setPlan] = useState("free");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState<"profile" | "resumes" | "applications">("profile");
    const [previewResume, setPreviewResume] = useState<Resume | null>(null);

    // Form fields
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [skills, setSkills] = useState("");
    const [experience, setExperience] = useState("");
    const [education, setEducation] = useState("");
    const [location, setLocation] = useState("");
    const [targetRole, setTargetRole] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("hirekit_user");
        if (!stored) { router.push("/login"); return; }
        const u = JSON.parse(stored);
        setUser(u);
        loadProfile(u.email);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadProfile = async (email: string) => {
        try {
            const res = await fetch(`${API_URL}/api/profile?email=${email}`);
            const data = await res.json();
            if (data.profile) {
                setProfile(data.profile);
                setName(data.profile.name || "");
                setUsername(data.profile.username || "");
                setAvatarUrl(data.profile.avatar_url || "");
                setSkills((data.profile.skills || []).join(", "));
                setExperience(data.profile.experience || "");
                setEducation(data.profile.education || "");
                setLocation(data.profile.location || "");
                setTargetRole(data.profile.target_role || "");
            }
            if (data.resumes) setResumes(data.resumes);
            if (data.applications) setApplications(data.applications);
            if (data.usage?.plan) setPlan(data.usage.plan);
        } catch (err) {
            console.error("Load error:", err);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await fetch(`${API_URL}/api/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    name,
                    username,
                    avatar_url: avatarUrl,
                    skills: skills.split(",").map(s => s.trim()).filter(Boolean),
                    experience,
                    education,
                    location,
                    target_role: targetRole,
                }),
            });
            setEditing(false);
            await loadProfile(user.email);
        } catch (err) {
            console.error("Save error:", err);
        }
        setSaving(false);
    };

    const downloadResume = (resume: Resume, format: "txt" | "html") => {
        let content: string;
        let mimeType: string;
        let ext: string;

        if (format === "html") {
            content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${resume.job_title} Resume</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;line-height:1.6;color:#222}h1,h2{border-bottom:1px solid #ccc;padding-bottom:4px}</style></head><body><pre style="white-space:pre-wrap;font-family:inherit">${resume.resume_text}</pre></body></html>`;
            mimeType = "text/html";
            ext = "html";
        } else {
            content = resume.resume_text;
            mimeType = "text/plain";
            ext = "txt";
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `HireKit-Resume-${resume.job_title.replace(/\s+/g, "-")}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLogout = () => {
        localStorage.removeItem("hirekit_user");
        localStorage.removeItem("hirekit_token");
        router.push("/login");
    };

    if (!user) return null;

    const planColors: Record<string, string> = { free: "#888", pro: "#3b82f6", premium: "#8b5cf6" };
    const statusColors: Record<string, string> = { applied: "#3b82f6", interview: "#f59e0b", rejected: "#ef4444", offer: "#22c55e", pending: "#888" };

    return (
        <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "Inter, sans-serif" }}>
            {/* Header */}
            <header style={{ padding: "12px 20px", background: "#fff", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                        <img src="/favicon.png" alt="" style={{ width: 28, height: 28 }} />
                        <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>HireKit</span>
                    </a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <a href="/" style={{ fontSize: 13, color: "#555", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg> Back to Chat
                    </a>
                    <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
                {/* User card */}
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
                    {(profile?.avatar_url || user.avatar) ? (
                        <img src={profile?.avatar_url || user.avatar} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#888" }}>
                            {(profile?.name || user.name || "?")[0].toUpperCase()}
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{profile?.name || user.name}</div>
                        {profile?.username && <div style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>@{profile.username}</div>}
                        <div style={{ fontSize: 13, color: "#888" }}>{user.email}</div>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: planColors[plan] || "#888", color: "#fff" }}>
                        {plan.toUpperCase()}
                    </span>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid #eee" }}>
                    {(["profile", "resumes", "applications"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: "10px 20px", fontSize: 14, fontWeight: tab === t ? 600 : 400,
                            color: tab === t ? "#111" : "#888", background: "none", border: "none",
                            borderBottom: tab === t ? "2px solid #111" : "2px solid transparent",
                            cursor: "pointer", textTransform: "capitalize",
                        }}>{t} {t === "resumes" ? `(${resumes.length})` : t === "applications" ? `(${applications.length})` : ""}</button>
                    ))}
                </div>

                {/* Profile Tab */}
                {tab === "profile" && (
                    <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Profile Details</h2>
                            {!editing ? (
                                <button onClick={() => setEditing(true)} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Edit</button>
                            ) : (
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => setEditing(false)} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 13, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Cancel</button>
                                    <button onClick={handleSave} disabled={saving} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", background: "#111", color: "#fff", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save"}</button>
                                </div>
                            )}
                        </div>

                        {editing ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {[
                                    { label: "Full Name", value: name, set: setName },
                                    { label: "Target Role", value: targetRole, set: setTargetRole, placeholder: "e.g. Barista, React Developer, Nurse" },
                                    { label: "Skills (comma separated)", value: skills, set: setSkills, placeholder: "e.g. React, Node.js, TypeScript" },
                                    { label: "Experience", value: experience, set: setExperience, placeholder: "e.g. 3 years" },
                                    { label: "Education", value: education, set: setEducation, placeholder: "e.g. B.Tech CSE, VIT University" },
                                    { label: "Preferred Location", value: location, set: setLocation, placeholder: "e.g. Dubai, Bangalore, Remote" },
                                ].map(f => (
                                    <div key={f.label}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 4 }}>{f.label}</label>
                                        <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder || ""} style={{
                                            width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                                        }} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                {[
                                    { label: "Name", value: profile?.name },
                                    { label: "Target Role", value: profile?.target_role },
                                    { label: "Skills", value: profile?.skills?.join(", ") },
                                    { label: "Experience", value: profile?.experience },
                                    { label: "Education", value: profile?.education },
                                    { label: "Location", value: profile?.location },
                                ].map(f => (
                                    <div key={f.label}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 2 }}>{f.label}</div>
                                        <div style={{ fontSize: 14, color: f.value ? "#111" : "#ccc" }}>{f.value || "Not set"}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Resumes Tab */}
                {tab === "resumes" && (
                    <div>
                        {resumes.length === 0 ? (
                            <div style={{ background: "#fff", borderRadius: 16, padding: 40, textAlign: "center", color: "#888", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                                <div style={{ marginBottom: 16 }}><FileText size={36} color="#ccc" strokeWidth={1.5} /></div>
                                <p>No resumes yet. Go to chat and ask &ldquo;Build me a resume&rdquo;!</p>
                                <a href="/" style={{ color: "#555", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", fontWeight: 500 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg> Go to Chat
                                </a>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {resumes.map(r => (
                                    <div key={r.id} style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", flexShrink: 0 }}><FileText size={20} strokeWidth={2} /></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{r.job_title}</div>
                                            <div style={{ fontSize: 12, color: "#888" }}>{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button onClick={() => setPreviewResume(r)} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>View</button>
                                            <button onClick={() => downloadResume(r, "txt")} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, border: "none", background: "#111", color: "#fff", cursor: "pointer" }}>Download</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Resume preview modal */}
                        {previewResume && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={() => setPreviewResume(null)}>
                                <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 640, width: "100%", maxHeight: "80vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{previewResume.job_title}</h3>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button onClick={() => downloadResume(previewResume, "txt")} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, border: "none", background: "#111", color: "#fff", cursor: "pointer" }}>📄 TXT</button>
                                            <button onClick={() => downloadResume(previewResume, "html")} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>🌐 HTML</button>
                                            <button onClick={() => setPreviewResume(null)} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>✕</button>
                                        </div>
                                    </div>
                                    <pre style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", color: "#222", margin: 0 }}>{previewResume.resume_text}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Applications Tab */}
                {tab === "applications" && (
                    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                        {applications.length === 0 ? (
                            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
                                <div style={{ marginBottom: 16 }}><Briefcase size={36} color="#ccc" strokeWidth={1.5} /></div>
                                <p>No applications yet. Find jobs in chat and auto-apply!</p>
                                <a href="/" style={{ color: "#555", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", fontWeight: 500 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg> Go to Chat
                                </a>
                            </div>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #eee", background: "#fafafa" }}>
                                        <th style={{ textAlign: "left", padding: "10px 14px", color: "#888", fontWeight: 500 }}>Job</th>
                                        <th style={{ textAlign: "left", padding: "10px 14px", color: "#888", fontWeight: 500 }}>Company</th>
                                        <th style={{ textAlign: "left", padding: "10px 14px", color: "#888", fontWeight: 500 }}>Status</th>
                                        <th style={{ textAlign: "left", padding: "10px 14px", color: "#888", fontWeight: 500 }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map(app => (
                                        <tr key={app.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                            <td style={{ padding: "10px 14px", fontWeight: 500 }}>{app.job_title}</td>
                                            <td style={{ padding: "10px 14px", color: "#555" }}>{app.company}</td>
                                            <td style={{ padding: "10px 14px" }}>
                                                <span style={{ padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: statusColors[app.status] || "#888", color: "#fff" }}>{app.status}</span>
                                            </td>
                                            <td style={{ padding: "10px 14px", color: "#888" }}>{new Date(app.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}
