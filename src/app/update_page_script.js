const fs = require('fs');

let content = fs.readFileSync('page.tsx', 'utf8');

// Add Menu, Plus, LogOut, PanelLeft to lucide-react (wait, they didn't import lucide in page.tsx)
content = content.replace(
    'import { useRouter, useSearchParams } from "next/navigation";',
    'import { useRouter, useSearchParams } from "next/navigation";\nimport { Menu, Plus, LogOut, PanelLeft, Settings } from "lucide-react";'
);

// Add ChatSession interface
content = content.replace(
    'interface ChatMessage {',
    'interface ChatSession {\n    id: string;\n    title: string;\n    updatedAt: string;\n}\n\ninterface ChatMessage {'
);

// Add session state and sidebar state
content = content.replace(
    'const [uploading, setUploading] = useState(false);',
    'const [uploading, setUploading] = useState(false);\n    const [sessions, setSessions] = useState<ChatSession[]>([]);\n    const [sidebarOpen, setSidebarOpen] = useState(false);'
);

// Update initial load to fetch sessions and use dynamic jokes
const welcomeLogicRaw = `
        // Welcome message
        const upgraded = searchParams.get("upgraded");
        const welcome: ChatMessage = upgraded
            ? {
                id: "welcome",
                role: "assistant",
                content: \`🎉 Welcome to Pro! You now have:\\n✅ 100 chats/day\\n✅ 20 auto-applies/day\\n✅ All locations (India + Gulf + Remote)\\nWhat would you like to do first?\`,
                action: "NONE",
            }
            : {
                id: "welcome",
                role: "assistant",
                content: \`👋 Hi \${u.name?.split(" ")[0] || "there"}! I'm HireKit AI.\\nTell me about yourself — your profession, experience, and where you want to work.\\nI'll find you jobs and apply automatically!\`,
                action: "NONE",
            };
        setMessages([welcome]);
`;

const welcomeLogicNew = `
        const fetchSessions = async () => {
            const tk = localStorage.getItem("hirekit_token");
            if (tk) {
                try {
                    const res = await fetch(\`\${API_URL}/api/chat/sessions\`, { headers: { Authorization: \`Bearer \${tk}\` } });
                    const d = await res.json();
                    if (d.sessions) setSessions(d.sessions);
                } catch(e) {}
            }
        };
        fetchSessions();

        const upgraded = searchParams.get("upgraded");
        const jokes = [
            \`They say AI will take your job... but right now, I'm just here to apply for them on your behalf! 😂\\nWhat's your profession and target role?\`,
            \`Beep boop! 🤖 I'm HireKit AI. Give me your dream role, and I'll find you jobs while you grab coffee ☕.\`,
            \`👋 Hi \${u.name?.split(" ")[0] || "there"}! Let's get you hired before the next AI update takes over completely. 😉\\nWhat kind of jobs are you looking for?\`,
            \`I'm like ChatGPT, but instead of writing poems, I write resumes and click "Apply". 😎\\nTell me about your experience!\`,
        ];
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

        const welcome: ChatMessage = upgraded
            ? { id: "welcome", role: "assistant", content: \`🎉 Welcome to Pro! You now have:\\n✅ 100 chats/day\\n✅ 20 auto-applies/day\\n✅ All locations (India + Gulf + Remote)\\nWhat would you like to do first?\`, action: "NONE" }
            : { id: "welcome", role: "assistant", content: randomJoke, action: "NONE" };
        
        setMessages([welcome]);
`;

content = content.replace(welcomeLogicRaw, welcomeLogicNew);

const sendLogicRaw = `const res = await fetch(\`\${API_URL}/api/chat\`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },`;

const sendLogicNew = `const token = localStorage.getItem("hirekit_token");
            const res = await fetch(\`\${API_URL}/api/chat\`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${token}\` },`;
                
content = content.replace(sendLogicRaw, sendLogicNew);

const uploadLogicRaw = `const chatRes = await fetch(\`\${API_URL}/api/chat\`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },`;
                
const uploadLogicNew = `const token = localStorage.getItem("hirekit_token");
            const chatRes = await fetch(\`\${API_URL}/api/chat\`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${token}\` },`;

content = content.replace(uploadLogicRaw, uploadLogicNew);

// Add loadSession function
const handleKeyStr = 'const handleKey = (e: React.KeyboardEvent) => {';
const loadSessionFunc = `
    const loadSession = async (id: string) => {
        const token = localStorage.getItem("hirekit_token");
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(\`\${API_URL}/api/chat/history/\${id}\`, { headers: { Authorization: \`Bearer \${token}\` } });
            const data = await res.json();
            if (data.history) {
                setMessages(data.history.map((h: any) => ({ id: h.id, role: h.role, content: h.content, action: "NONE" })));
            }
        } catch (err) {}
        setLoading(false);
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    const handleKey = (e: React.KeyboardEvent) => {
`;
content = content.replace(handleKeyStr, loadSessionFunc);

fs.writeFileSync('page.tsx', content);
