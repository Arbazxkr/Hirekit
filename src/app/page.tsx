"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResumePreview } from "@/components/ResumePreview";
import { useTheme } from "next-themes";
import { Menu, X, Plus, LogOut, User as UserIcon, Monitor, Moon, Sun, Paperclip, Send, PanelLeft, SquarePen, Globe, Book, Image as ImageIcon, ArrowUp } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    action?: string;
    result?: Record<string, unknown>;
}

interface ChatSession {
    id: string;
    title: string;
    updatedAt: string;
}

export default function Home() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-white dark:bg-[#212121] text-zinc-500">Loading...</div>}>
            <HomeInner />
        </Suspense>
    );
}

function HomeInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme, setTheme } = useTheme();

    const [user, setUser] = useState<Record<string, string> | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);

    // UI state
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [welcomeMsg, setWelcomeMsg] = useState<ChatMessage | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load
    useEffect(() => {
        const stored = localStorage.getItem("hirekit_user");
        const token = localStorage.getItem("hirekit_token");
        if (!stored || !token) {
            router.push("/login");
            return;
        }
        const u = JSON.parse(stored);
        setUser(u);

        // Fetch past sessions
        fetch(`${API_URL}/api/chat/sessions`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.sessions) setSessions(data.sessions);
            })
            .catch(console.error);

        startNewChat(u);

        // Auto-close sidebar on mobile
        if (window.innerWidth < 768) setSidebarOpen(false);
    }, [router, searchParams]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const startNewChat = (u: Record<string, string>) => {
        const newId = Date.now().toString();
        setSessionId(newId);

        const upgraded = searchParams.get("upgraded");
        const jokes = [
            `They say AI will take your job... but right now, I'm just here to apply for them on your behalf! 😂\nWhat's your profession and target role?`,
            `Beep boop! 🤖 I'm HireKit AI. Give me your dream role, and I'll find you jobs while you grab coffee ☕.`,
            `👋 Hi ${u?.name?.split(" ")[0] || "there"}! Let's get you hired before the next AI update takes over completely. 😉\nWhat kind of jobs are you looking for?`,
            `I'm like ChatGPT, but instead of writing poems, I write resumes and click "Apply". 😎\nTell me about your experience!`,
        ];
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

        const msg: ChatMessage = upgraded
            ? { id: "welcome", role: "assistant", content: `🎉 Welcome to Pro! You now have:\n✅ 100 chats/day\n✅ 20 auto-applies/day\n✅ All locations (India + Gulf + Remote)\nWhat would you like to do first?`, action: "NONE" }
            : { id: "welcome", role: "assistant", content: randomJoke, action: "NONE" };

        setMessages([msg]);
        setWelcomeMsg(msg);
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    const loadSession = async (id: string) => {
        const token = localStorage.getItem("hirekit_token");
        if (!token) return;
        setSessionId(id);
        setLoading(true);
        if (window.innerWidth < 768) setSidebarOpen(false);
        try {
            const res = await fetch(`${API_URL}/api/chat/history/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.history) {
                setMessages(data.history.map((h: any) => ({
                    id: h.id, role: h.role, content: h.content, action: "NONE"
                })));
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const send = async (text?: string) => {
        const msg = (text || input).trim();
        if (!msg || loading) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: msg };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const token = localStorage.getItem("hirekit_token");
            const res = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    message: msg,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
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
            setMessages(prev => [...prev, aiMsg]);

            // Refresh sessions list if it was a new chat
            if (messages.length <= 1) {
                fetch(`${API_URL}/api/chat/sessions`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(r => r.json()).then(d => { if (d.sessions) setSessions(d.sessions); });
            }
        } catch (err) {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: `Failed: ${(err as Error).message}` }]);
        }
        setLoading(false);
    };

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
            const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: `📎 Uploaded: ${data.name}` };
            setMessages(prev => [...prev, userMsg]);

            setLoading(true);
            const token = localStorage.getItem("hirekit_token");
            const chatRes = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    message: `I uploaded "${data.name}". Content:\n${(data.text as string).slice(0, 3000)}`,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    email: user?.email,
                    sessionId,
                }),
            });
            const chatData = await chatRes.json();
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", ...chatData }]);
        } catch (err) {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: `Failed to process file.` }]);
        }
        setUploading(false);
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleLogout = () => {
        localStorage.removeItem("hirekit_user");
        localStorage.removeItem("hirekit_token");
        router.push("/login");
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    if (!user) return null;

    const renderResult = (msg: ChatMessage) => {
        if (!msg.action || msg.action === "NONE" || !msg.result) return null;

        switch (msg.action) {
            case "SEARCH_JOBS": {
                const jobs = (msg.result as any).jobs || [];
                if (!jobs.length) return null;
                return (
                    <div className="flex flex-col gap-2 mt-3 max-w-lg">
                        {jobs.slice(0, 8).map((job: any) => (
                            <div key={job.id} className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-3.5 bg-zinc-50 dark:bg-zinc-800/50">
                                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">💼 {job.title}</div>
                                <div className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1">{job.company} • {job.location}</div>
                                {job.salary_min && (
                                    <div className="text-[13px] text-green-600 dark:text-green-500 mt-0.5">₹{Math.round(job.salary_min / 1000)}K - ₹{Math.round((job.salary_max || job.salary_min) / 1000)}K</div>
                                )}
                                <div className="flex gap-2 mt-3">
                                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition">View Job</a>
                                    <button onClick={() => send(`Apply to ${job.url}`)} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#212121] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-black dark:hover:bg-white transition">Auto Apply</button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
            case "BUILD_RESUME": return <ResumePreview resumeText={(msg.result as any).resume} />;
            case "SCORE_RESUME": return (
                <div className="mt-3 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 max-w-sm">
                    <div className="text-4xl font-extrabold text-center text-blue-600 dark:text-blue-500">{(msg.result as any).score}</div>
                    <div className="text-center text-[13px] text-zinc-500 dark:text-zinc-400 mb-3">ATS Score out of 100</div>
                </div>
            );
            case "AUTO_APPLY": return (
                <div className={`mt-3 p-3 rounded-lg text-[13px] ${(msg.result as any).success ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
                    {(msg.result as any).success ? "✅" : "❌"} {(msg.result as any).message}
                </div>
            );
            case "SHOW_APPLICATIONS": return <div className="text-[13px] text-zinc-500 mt-2">Check full applications history in your Profile page.</div>;
            case "SHOW_PLAN": return <div className="text-[13px] text-zinc-500 mt-2">Check your subscription and limits in the Profile page.</div>;
            case "SAVE_PROFILE": return <div className="mt-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-[12px] text-green-700 dark:text-green-400 inline-block">✅ Profile saved!</div>;
            default: return null;
        }
    };

    return (
        <div className="flex h-screen bg-white dark:bg-[#212121] overflow-hidden text-zinc-900 dark:text-zinc-100 selection:bg-blue-100 dark:selection:bg-blue-900">
            {/* Sidebar (Desktop + Mobile overlay) */}
            <div className={`fixed inset-y-0 left-0 z-40 w-[260px] bg-[#f9f9f9] dark:bg-[#171717] transform transition-transform duration-300 ease-in-out md:relative ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col ${!sidebarOpen && "md:hidden"}`}>

                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-3 mt-1">
                    <button onClick={toggleSidebar} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition" title="Close sidebar">
                        <PanelLeft size={20} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => startNewChat(user)} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition" title="New chat">
                        <SquarePen size={20} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Chat History List */}
                <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                    <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-3 px-2 mt-2">Today</div>
                    <div className="flex flex-col gap-1">
                        {sessions.map(s => (
                            <button key={s.id} onClick={() => loadSession(s.id)} className={`text-left px-3 py-2.5 rounded-lg text-sm truncate transition ${s.id === sessionId ? "bg-[#ebebeb] dark:bg-[#212121] font-medium text-zinc-900 dark:text-zinc-100" : "hover:bg-zinc-200/60 dark:hover:bg-[#212121] text-zinc-800 dark:text-zinc-300"}`}>
                                {s.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sidebar Footer (Profile & Settings) */}
                <div className="p-3 flex flex-col gap-1 w-full text-sm">
                    <button onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-[#212121] transition">
                        {theme === "dark" ? <Sun size={18} strokeWidth={1.5} /> : theme === "light" ? <Moon size={18} strokeWidth={1.5} /> : <Monitor size={18} strokeWidth={1.5} />}
                        {theme === "dark" ? "Dark Mode" : theme === "light" ? "Light Mode" : "System Mode"}
                    </button>
                    <a href="/profile" className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-[#212121] transition">
                        <UserIcon size={18} strokeWidth={1.5} /> Profile & Settings
                    </a>

                    {/* User Profile Area */}
                    <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-[#2f2f2f]"></div>
                    <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-[#212121] transition group">
                        {user.avatar ? (
                            <img src={user.avatar} className="w-6 h-6 rounded-full" alt="" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">{(user.name || "?")[0]}</div>
                        )}
                        <span className="truncate">{user.name}</span>
                        <LogOut size={16} strokeWidth={1.5} className="ml-auto opacity-0 group-hover:opacity-100 text-zinc-500 transition-opacity" />
                    </button>
                </div>
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#212121] relative">
                {/* Header (Hidden on large screens when sidebar is open, visible to show toggle) */}
                {!sidebarOpen && (
                    <header className="absolute top-0 left-0 right-0 h-14 flex items-center px-4 z-10 bg-gradient-to-b from-white via-white/80 to-transparent dark:from-[#212121] dark:via-[#212121]/80 dark:to-transparent">
                        <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                            <PanelLeft size={24} strokeWidth={1.5} />
                        </button>
                        <div className="ml-2 font-semibold text-[16px] text-zinc-600 dark:text-zinc-300 flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg cursor-pointer transition">
                            HireKit <span className="text-zinc-400">v1.5</span>
                        </div>
                    </header>
                )}
                {sidebarOpen && (
                    <header className="absolute top-0 left-0 right-0 h-14 flex items-center px-4 z-10 md:hidden bg-gradient-to-b from-white via-white/80 to-transparent dark:from-[#212121] dark:via-[#212121]/80 dark:to-transparent">
                        <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                            <Menu size={24} strokeWidth={1.5} />
                        </button>
                    </header>
                )}

                {/* Messages */}
                <main className="flex-1 overflow-y-auto px-4 pb-4 pt-16 md:px-8">
                    <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-10">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center mt-20 mb-10 opacity-50 space-y-4">
                                <img src="/logo.png" className="w-12 h-12 dark:invert" alt="Logo" />
                                <h1 className="text-2xl font-semibold">How can I help you today?</h1>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className="flex gap-4 w-full">
                                {msg.role === "assistant" ? (
                                    <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#171717] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                                        <img src="/logo.png" alt="AI" className="w-4 h-4 dark:invert" />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 shrink-0 invisible md:hidden" /> // Spacer for alignment
                                )}

                                <div className={`flex flex-col ${msg.role === "user" ? "items-end ml-auto" : "max-w-[90%] md:max-w-[75%]"}`}>
                                    <div className={`px-5 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-[#f4f4f4] dark:bg-[#2f2f2f] text-zinc-900 dark:text-zinc-100 rounded-[24px] rounded-br-[8px]" : "bg-transparent text-zinc-900 dark:text-zinc-100"}`}>
                                        {msg.content}
                                    </div>
                                    {msg.role === "assistant" && renderResult(msg)}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-4 w-full">
                                <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#171717] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                                    <img src="/logo.png" alt="AI" className="w-4 h-4 dark:invert" />
                                </div>
                                <div className="px-5 py-3.5 text-[15px] font-medium text-zinc-400 animate-pulse">
                                    <span className="w-2 h-2 bg-zinc-400 rounded-full inline-block mr-1"></span>
                                    <span className="w-2 h-2 bg-zinc-400 rounded-full inline-block mr-1 animation-delay-150"></span>
                                    <span className="w-2 h-2 bg-zinc-400 rounded-full inline-block animation-delay-300"></span>
                                </div>
                            </div>
                        )}
                        {messages.length <= 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-auto mx-auto w-full max-w-2xl px-4">
                                {[
                                    { t: "I'm a software developer", p: "Looking for jobs in tech" },
                                    { t: "Looking for Gulf jobs", p: "Remote or onsite opportunities" },
                                    { t: "Help me build a resume", p: "Using my current profile data" },
                                    { t: "What can you do?", p: "Explain features and auto-apply tools" }
                                ].map(chip => (
                                    <button key={chip.t} onClick={() => send(chip.t)} className="flex flex-col text-left px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#212121] hover:bg-[#f9f9f9] dark:hover:bg-[#2f2f2f] transition-all group">
                                        <span className="text-[14px] font-medium text-zinc-700 dark:text-zinc-200">{chip.t}</span>
                                        <span className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-0.5">{chip.p}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={bottomRef} className="h-6" />
                    </div>
                </main>

                {/* Input Area */}
                <div className="p-4 md:px-8 md:pb-6 bg-transparent">
                    <div className="max-w-3xl mx-auto relative">
                        <div className="flex flex-col bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-[26px] p-2 border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition duration-200 shadow-sm">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                                placeholder={uploading ? "Reading file..." : "Message HireKit..."}
                                rows={1}
                                disabled={uploading}
                                className="w-full max-h-48 px-4 py-3 bg-transparent border-none outline-none resize-none text-[16px] placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal leading-relaxed overflow-y-auto"
                            />
                            <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
                                <div className="flex items-center gap-1.5">
                                    <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md" onChange={handleUpload} className="hidden" />
                                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading || loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 disabled:opacity-50 transition">
                                        <Paperclip size={16} strokeWidth={2} /> <span className="hidden sm:inline">Attach</span>
                                    </button>
                                    <button onClick={() => send("Search for remote jobs")} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 transition">
                                        <Globe size={16} strokeWidth={2} /> Search
                                    </button>
                                    <button onClick={() => send("Review my resume")} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 transition">
                                        <Book size={16} strokeWidth={2} /> Assess
                                    </button>
                                </div>
                                <button onClick={() => send()} disabled={!input.trim() || loading || uploading} className={`flex items-center justify-center w-8 h-8 rounded-full ${input.trim() && !loading ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-[#e5e5e5] dark:bg-[#404040] text-zinc-400 dark:text-zinc-500'} transition-all`}>
                                    <ArrowUp size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                        <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 font-medium">
                            HireKit AI can make mistakes. Verify important facts and jobs output.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
