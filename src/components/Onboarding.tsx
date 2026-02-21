"use client";

import { useState } from "react";
import type { UserProfile } from "@/app/page";

const FIELDS = [
    { id: "tech", label: "💻 Technology", desc: "Software, IT, Data Science" },
    { id: "hospitality", label: "🍽️ Hospitality", desc: "Restaurant, Hotel, Cafe" },
    { id: "retail", label: "🛍️ Retail", desc: "Sales, Store, Shopping" },
    { id: "healthcare", label: "🏥 Healthcare", desc: "Medical, Nursing, Pharma" },
    { id: "business", label: "📊 Business", desc: "Marketing, Finance, HR" },
    { id: "creative", label: "🎨 Creative", desc: "Design, Writing, Media" },
    { id: "delivery", label: "🚚 Delivery", desc: "Driver, Warehouse, Logistics" },
    { id: "other", label: "📋 Other", desc: "Any other field" },
];

type Step = "field" | "personal" | "experience" | "education" | "skills" | "projects";

const STEPS: { key: Step; title: string; subtitle: string }[] = [
    { key: "field", title: "What field are you in?", subtitle: "We'll find the right jobs for you" },
    { key: "personal", title: "About you", subtitle: "Basic details for your resume" },
    { key: "experience", title: "Work experience", subtitle: "Add your previous roles" },
    { key: "education", title: "Education", subtitle: "Your academic background" },
    { key: "skills", title: "Your skills", subtitle: "What are you good at?" },
    { key: "projects", title: "Projects", subtitle: "Anything you've built or worked on" },
];

export function Onboarding({ onComplete }: { onComplete: (p: UserProfile) => void }) {
    const [stepIdx, setStepIdx] = useState(0);
    const [field, setField] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [experiences, setExperiences] = useState([{ company: "", role: "", duration: "", bullets: [""] }]);
    const [education, setEducation] = useState([{ degree: "", institution: "", year: "" }]);
    const [skillsText, setSkillsText] = useState("");
    const [projects, setProjects] = useState([{ name: "", description: "", techStack: "", link: "" }]);

    const step = STEPS[stepIdx];
    const next = () => stepIdx < STEPS.length - 1 && setStepIdx(stepIdx + 1);
    const back = () => stepIdx > 0 && setStepIdx(stepIdx - 1);

    const finish = () => {
        onComplete({
            name, email, phone, location, linkedinUrl, field,
            experience: experiences.filter(e => e.company || e.role),
            education: education.filter(e => e.degree || e.institution),
            skills: skillsText.split(",").map(s => s.trim()).filter(Boolean),
            projects: projects.filter(p => p.name),
        });
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", padding: 20 }}>
            <div style={{ maxWidth: 540, width: "100%" }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
                        HireKit
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>Your AI job assistant</p>
                </div>

                {/* Card */}
                <div className="card animate-in">
                    {/* Progress */}
                    <div style={{ display: "flex", gap: 3, marginBottom: 24 }}>
                        {STEPS.map((_, i) => (
                            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= stepIdx ? "var(--accent)" : "var(--border)", transition: "background 0.3s" }} />
                        ))}
                    </div>

                    {/* Header */}
                    <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{step.title}</h2>
                    <p style={{ color: "var(--text-secondary)", marginBottom: 20, fontSize: 13 }}>{step.subtitle}</p>

                    {/* Fields */}
                    {step.key === "field" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {FIELDS.map(f => (
                                <button key={f.id} className="field-option" onClick={() => { setField(f.id); next(); }}
                                    style={{ border: field === f.id ? "1px solid var(--accent)" : undefined, background: field === f.id ? "var(--accent-light)" : undefined }}>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{f.label}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{f.desc}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {step.key === "personal" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
                            <input className="input" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                            <input className="input" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
                            <input className="input" placeholder="Location (e.g. Bangalore, India)" value={location} onChange={e => setLocation(e.target.value)} />
                            <input className="input" placeholder="LinkedIn URL (optional)" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
                        </div>
                    )}

                    {step.key === "experience" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {experiences.map((exp, i) => (
                                <div key={i} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 10 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                                        <input className="input" placeholder="Company" value={exp.company} onChange={e => { const n = [...experiences]; n[i].company = e.target.value; setExperiences(n); }} />
                                        <input className="input" placeholder="Role / Title" value={exp.role} onChange={e => { const n = [...experiences]; n[i].role = e.target.value; setExperiences(n); }} />
                                    </div>
                                    <input className="input" placeholder="Duration (e.g. Jan 2023 - Present)" value={exp.duration} onChange={e => { const n = [...experiences]; n[i].duration = e.target.value; setExperiences(n); }} style={{ marginBottom: 8 }} />
                                    <textarea className="input" placeholder="Key achievements (one per line)" value={exp.bullets.join("\n")} onChange={e => { const n = [...experiences]; n[i].bullets = e.target.value.split("\n"); setExperiences(n); }} />
                                </div>
                            ))}
                            <button className="btn-secondary" onClick={() => setExperiences([...experiences, { company: "", role: "", duration: "", bullets: [""] }])} style={{ alignSelf: "flex-start" }}>
                                + Add more
                            </button>
                            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>No experience? That&apos;s OK — skip this step</p>
                        </div>
                    )}

                    {step.key === "education" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {education.map((edu, i) => (
                                <div key={i} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                                    <input className="input" placeholder="Degree (e.g. B.Tech CS, 12th Pass)" value={edu.degree} onChange={e => { const n = [...education]; n[i].degree = e.target.value; setEducation(n); }} />
                                    <input className="input" placeholder="School / College" value={edu.institution} onChange={e => { const n = [...education]; n[i].institution = e.target.value; setEducation(n); }} />
                                    <input className="input" placeholder="Year" value={edu.year} onChange={e => { const n = [...education]; n[i].year = e.target.value; setEducation(n); }} />
                                </div>
                            ))}
                            <button className="btn-secondary" onClick={() => setEducation([...education, { degree: "", institution: "", year: "" }])} style={{ alignSelf: "flex-start" }}>
                                + Add more
                            </button>
                        </div>
                    )}

                    {step.key === "skills" && (
                        <div>
                            <textarea className="input" rows={4} placeholder={field === "tech" ? "React, TypeScript, Node.js, Python, SQL, Git..." : "Customer Service, Teamwork, Communication, Cash Handling..."} value={skillsText} onChange={e => setSkillsText(e.target.value)} />
                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Separate with commas</p>
                        </div>
                    )}

                    {step.key === "projects" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {projects.map((proj, i) => (
                                <div key={i} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                                    <input className="input" placeholder="Project name" value={proj.name} onChange={e => { const n = [...projects]; n[i].name = e.target.value; setProjects(n); }} />
                                    <textarea className="input" placeholder="What did you build?" value={proj.description} onChange={e => { const n = [...projects]; n[i].description = e.target.value; setProjects(n); }} />
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                        <input className="input" placeholder="Tech used" value={proj.techStack} onChange={e => { const n = [...projects]; n[i].techStack = e.target.value; setProjects(n); }} />
                                        <input className="input" placeholder="Link (optional)" value={proj.link} onChange={e => { const n = [...projects]; n[i].link = e.target.value; setProjects(n); }} />
                                    </div>
                                </div>
                            ))}
                            <button className="btn-secondary" onClick={() => setProjects([...projects, { name: "", description: "", techStack: "", link: "" }])} style={{ alignSelf: "flex-start" }}>
                                + Add more
                            </button>
                            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Skip if not applicable</p>
                        </div>
                    )}

                    {/* Navigation */}
                    {step.key !== "field" && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                            <button className="btn-secondary" onClick={back}>← Back</button>
                            {step.key === "projects" ? (
                                <button className="btn-primary" onClick={finish}>Get Started →</button>
                            ) : (
                                <button className="btn-primary" onClick={next}>Continue →</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
