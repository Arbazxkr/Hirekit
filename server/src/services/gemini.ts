type Message = { role: string; content: string };

interface UserContext {
    profile: Record<string, unknown> | null;
    plan: string;
    chatsRemaining: number;
    appliesRemaining: number;
}

export interface GeminiResponse {
    message: string;
    action: string;
    data: Record<string, unknown>;
}

// ─── Multi-Provider Fallback Engine ───
// Tries: Gemini → Anthropic → OpenAI. First success wins.

async function callWithGemini(systemPrompt: string, userPrompt: string, options: {
    history?: { role: string; parts: { text: string }[] }[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
}): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") throw new Error("GEMINI_API_KEY not set");

    const contents = [
        ...(options.history || []),
        { role: "user", parts: [{ text: userPrompt }] },
    ];

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
                contents,
                generationConfig: {
                    temperature: options.temperature ?? 0.7,
                    maxOutputTokens: options.maxTokens ?? 4096,
                    ...(options.jsonMode ? { responseMimeType: "application/json" } : {}),
                },
            }),
        },
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
    }

    const raw: Record<string, unknown> = await res.json();
    return (
        ((raw as Record<string, Array<{ content: { parts: Array<{ text: string }> } }>>)
            .candidates?.[0]?.content?.parts?.[0]?.text) || ""
    );
}

async function callWithAnthropic(systemPrompt: string, userPrompt: string, options: {
    history?: { role: string; content: string }[];
    temperature?: number;
    maxTokens?: number;
}): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const messages = [
        ...(options.history || []).map(m => ({
            role: m.role === "model" ? "assistant" : m.role,
            content: m.content,
        })),
        { role: "user", content: userPrompt },
    ];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: options.maxTokens ?? 4096,
            temperature: options.temperature ?? 0.7,
            system: systemPrompt,
            messages,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json() as { content: { type: string; text: string }[] };
    return data.content?.[0]?.text || "";
}

async function callWithOpenAI(systemPrompt: string, userPrompt: string, options: {
    history?: { role: string; content: string }[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
}): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const messages = [
        { role: "system", content: systemPrompt },
        ...(options.history || []).map(m => ({
            role: m.role === "model" ? "assistant" : m.role,
            content: m.content,
        })),
        { role: "user", content: userPrompt },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 4096,
            ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json() as { choices: { message: { content: string } }[] };
    return data.choices?.[0]?.message?.content || "";
}

// ─── Universal fallback caller ───
async function callLLM(systemPrompt: string, userPrompt: string, options: {
    geminiHistory?: { role: string; parts: { text: string }[] }[];
    chatHistory?: Message[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
}): Promise<string> {
    const errors: string[] = [];

    // 1. Try Gemini
    if (process.env.GEMINI_API_KEY) {
        try {
            console.log("[LLM] Trying Gemini...");
            return await callWithGemini(systemPrompt, userPrompt, {
                history: options.geminiHistory,
                temperature: options.temperature,
                maxTokens: options.maxTokens,
                jsonMode: options.jsonMode,
            });
        } catch (e) {
            errors.push(`Gemini: ${(e as Error).message}`);
            console.warn("[LLM] Gemini failed:", (e as Error).message);
        }
    }

    // 2. Try Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
        try {
            console.log("[LLM] Trying Anthropic...");
            const historyFormatted = (options.chatHistory || []).map(m => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
            }));
            return await callWithAnthropic(systemPrompt, userPrompt, {
                history: historyFormatted,
                temperature: options.temperature,
                maxTokens: options.maxTokens,
            });
        } catch (e) {
            errors.push(`Anthropic: ${(e as Error).message}`);
            console.warn("[LLM] Anthropic failed:", (e as Error).message);
        }
    }

    // 3. Try OpenAI
    if (process.env.OPENAI_API_KEY) {
        try {
            console.log("[LLM] Trying OpenAI...");
            const historyFormatted = (options.chatHistory || []).map(m => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
            }));
            return await callWithOpenAI(systemPrompt, userPrompt, {
                history: historyFormatted,
                temperature: options.temperature,
                maxTokens: options.maxTokens,
                jsonMode: options.jsonMode,
            });
        } catch (e) {
            errors.push(`OpenAI: ${(e as Error).message}`);
            console.warn("[LLM] OpenAI failed:", (e as Error).message);
        }
    }

    throw new Error(`All LLM providers failed:\n${errors.join("\n")}`);
}

// ─── System Prompt ───

function buildSystemPrompt(ctx: UserContext): string {
    const profileStr = ctx.profile
        ? JSON.stringify(ctx.profile, null, 2)
        : "No profile yet — user hasn't described themselves";

    return `You are HireKit AI, a smart job hunting assistant.
You help users find jobs, build resumes, write cover letters,
auto-apply to jobs, and prepare for interviews.

Current user profile:
${profileStr}

Current user plan: ${ctx.plan}
Chats remaining today: ${ctx.chatsRemaining === -1 ? "unlimited" : ctx.chatsRemaining}
Auto-applies remaining today: ${ctx.appliesRemaining === -1 ? "unlimited" : ctx.appliesRemaining}

IMPORTANT RULES:
1. Always respond in valid JSON — never plain text
2. Be conversational, friendly, and encouraging
3. Keep messages short — max 3 sentences
4. If user is on Free plan and asks for auto-apply, set action to SHOW_PLAN and explain they need Pro
5. If user hits daily chat limit, set action to SHOW_PLAN
6. If user profile is empty or missing key info, ask them to describe themselves before doing anything else
7. Remember context from earlier in conversation
8. For Gulf jobs, mention visa, tax-free salary benefits
9. Always confirm before auto-applying
10. Never show raw JSON in message field

PROFESSION AWARENESS:
You serve ALL professions — not just tech. Examples:
- Hospitality: barista, bar manager, restaurant crew, waiter, chef, hotel staff
- Healthcare: nurse, pharmacist, lab technician, caregiver
- Blue collar: driver, security guard, electrician, plumber, welder
- Retail: cashier, store manager, sales associate
- Office: accountant, HR executive, admin assistant, receptionist
- Tech: developer, designer, data analyst, IT support
- Construction: site engineer, foreman, mason, crane operator
- Education: teacher, tutor, trainer
- Gulf-specific: any of the above for UAE, Saudi, Qatar, Oman, Kuwait, Bahrain

Adapt your language and questions to the user's profession:
- For a barista: ask about coffee certifications, customer handling, POS systems
- For a nurse: ask about specialization, license (MOH/DHA/HAAD), hospital experience
- For a driver: ask about license type (LMV/HMV), years on road, routes known
- For a chef: ask about cuisine specialization, hotel stars worked, team size managed
- For tech: ask about languages, frameworks, tools
- NEVER assume everyone is a developer

SMART FOLLOW-UP RULES:
- If user says their profession → ask about years of experience in that field
- If user gives experience → ask about key skills relevant to THEIR profession (not tech skills)
- If user gives skills + experience → ask where they want to work (India, Gulf, Remote, both?)
- If user wants to build a resume, explicitly ask for their Full Name, Phone Number, City, LinkedIn URL, and GitHub so the resume looks complete. Let them know they can say "skip". DO NOT trigger BUILD_RESUME until they answer or skip.
- NEVER do a job search or build resume if you don't have at least: profession and years_experience
- Ask ONE question at a time, not multiple
- For Gulf job seekers: ask if they have passport, any Gulf experience, visa status

DOCUMENT UPLOAD RULES:
- When user uploads a resume/CV, extract: name, skills, experience, education, contact info
- Set action to SAVE_PROFILE with all extracted data
- Tell the user what you found: "I found X years of experience in Y, skills in Z..."
- If the document is a certificate (food safety, nursing license, driving license) — acknowledge it and mention it will strengthen their resume
- If the document is a reference letter, recommendation, or project — acknowledge and ask how they want to use it
- Save uploaded resume text in data.resume_text field so it's stored for later use

ACTIONS you can trigger:

SAVE_PROFILE — when user describes themselves OR when you extract info from uploaded document. If they provide Phone, LinkedIn, or GitHub, combine that into the resume_text field.
data: { name, profession, years_experience, skills[], job_location_preference, target_role, target_location, education, resume_text }

SEARCH_JOBS — when user asks for jobs (ONLY if you have enough profile info)
data: { query, location }

BUILD_RESUME — when user wants a resume (ONLY if you have enough profile info)
data: { job_title, job_description }

SCORE_RESUME — when user wants resume scored
data: { job_description }

AUTO_APPLY — when user wants to apply
data: { job_url, apply_all }

COVER_LETTER — when user wants cover letter
data: { job_title, company }

INTERVIEW_PREP — when user wants interview help
data: { job_title, company }

SHOW_APPLICATIONS — when user asks about applications
data: {}

SHOW_PLAN — when user asks about plan, limits, or pricing
data: {}

UPGRADE_PLAN — when user wants to upgrade
data: { plan: "pro" | "premium" }

NONE — general conversation, greetings, questions, follow-up questions
data: {}

Respond ONLY in this JSON format — no other text:
{"message": "your reply here", "action": "ACTION_NAME", "data": {}}`;
}

// ─── Main Chat Function ───

export async function callGemini(
    message: string,
    history: Message[] = [],
    userContext?: UserContext,
): Promise<GeminiResponse> {
    const systemPrompt = buildSystemPrompt(
        userContext || { profile: null, plan: "free", chatsRemaining: 5, appliesRemaining: 0 },
    );

    const geminiHistory = history.slice(-20).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
    }));

    const text = await callLLM(systemPrompt, message, {
        geminiHistory,
        chatHistory: history.slice(-20),
        temperature: 0.7,
        maxTokens: 4096,
        jsonMode: true,
    });

    // Parse JSON response
    try {
        const parsed = JSON.parse(text) as GeminiResponse;
        return {
            message: parsed.message || "I'm not sure how to help with that.",
            action: parsed.action || "NONE",
            data: parsed.data || {},
        };
    } catch {
        // If LLM didn't return valid JSON, wrap it
        return { message: text || "Something went wrong.", action: "NONE", data: {} };
    }
}

// ─── Vision (Gemini only — other providers don't have inline image support easily) ───

export async function callGeminiVision(
    prompt: string,
    imageBase64: string,
    mimeType: string,
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
        throw new Error("GEMINI_API_KEY not configured (vision requires Gemini)");
    }

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType, data: imageBase64 } },
                        ],
                    },
                ],
                generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
            }),
        },
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Vision error: ${err.slice(0, 200)}`);
    }

    const data: Record<string, unknown> = await res.json();
    const text =
        ((data as Record<string, Array<{ content: { parts: Array<{ text: string }> } }>>)
            .candidates?.[0]?.content?.parts?.[0]?.text) || "Could not read image.";
    return text;
}

// ─── Generate Resume (with fallback) ───

export async function generateResume(
    profile: Record<string, unknown>,
    jobTitle: string,
    jobDescription?: string,
): Promise<string> {
    const prompt = `Generate a professional, ATS-friendly resume for:
PROFILE: ${JSON.stringify(profile)}
TARGET JOB: ${jobTitle}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}` : ""}

RULES:
- Format the output as a beautiful Markdown ATS Resume.
- Use simple-icons SVG badges for the Contact Section (e.g. ![Email](https://img.shields.io/badge/Email-D14836?style=flat&logo=gmail&logoColor=white) email@link.com, ![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white), ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white), ![Phone](https://img.shields.io/badge/Phone-25D366?style=flat&logo=whatsapp&logoColor=white)).
- NEVER use fake placeholders like [City, State], [Phone Number], or [LinkedIn URL]. If a piece of contact information or location is missing from the provided PROFILE, completely OMIT that field.
- If the user's name is just an email prefix (e.g., "arbazbotiphone"), try to capitalize and format it nicely, or fall back to standard text.
- Detect the person's profession and adapt the resume format accordingly
- For tech roles: use sections CONTACT, SUMMARY, EXPERIENCE, EDUCATION, SKILLS, PROJECTS
- For hospitality (waiter, barista, chef, hotel): use CONTACT, SUMMARY, EXPERIENCE, SKILLS, CERTIFICATIONS (food safety, HACCP, etc.)
- For healthcare (nurse, caregiver): use CONTACT, SUMMARY, EXPERIENCE, LICENSES & CERTIFICATIONS, SKILLS, EDUCATION
- For blue collar (driver, electrician, welder): use CONTACT, SUMMARY, EXPERIENCE, LICENSES, SKILLS, SAFETY TRAINING
- For retail/office: use CONTACT, SUMMARY, EXPERIENCE, EDUCATION, SKILLS
- For Gulf jobs: mention visa readiness, passport validity, any Gulf experience
- Use action verbs relevant to the profession (e.g. "served 200+ customers daily" for hospitality, "managed team of 5" for management)
- Include quantified achievements where possible
- Keep to 1 page. Plain text markdown format. ATS-scannable.`;

    return await callLLM("", prompt, { temperature: 0.5, maxTokens: 4096 });
}

// ─── Score Resume (with fallback) ───

export async function scoreResume(
    resumeText: string,
    jobDescription: string,
): Promise<{ score: number; feedback: string[]; missing: string[] }> {
    const prompt = `Score this resume against the job. Return ONLY JSON:
{"score": 0-100, "feedback": ["point1","point2"], "missing": ["keyword1","keyword2"]}

RESUME:\n${resumeText}\n\nJOB:\n${jobDescription}`;

    const text = await callLLM("", prompt, { temperature: 0.1, maxTokens: 1024, jsonMode: true });

    try {
        return JSON.parse(text);
    } catch {
        return { score: 0, feedback: ["Could not parse score"], missing: [] };
    }
}

// ─── Generate Cover Letter (with fallback) ───

export async function generateCoverLetter(
    profile: Record<string, unknown>,
    jobTitle: string,
    company: string,
): Promise<string> {
    const prompt = `Write a professional cover letter for:
PROFILE: ${JSON.stringify(profile)}
JOB: ${jobTitle} at ${company}

Keep it concise (3-4 paragraphs), professional, and tailored.`;

    return await callLLM("", prompt, { temperature: 0.7, maxTokens: 2048 });
}

// ─── Interview Coaching (with fallback) ───

export async function interviewCoach(
    profile: Record<string, unknown>,
    jobTitle: string,
    company: string,
): Promise<string> {
    const prompt = `Generate interview preparation for:
PROFILE: ${JSON.stringify(profile)}
JOB: ${jobTitle} at ${company}

Include:
1. 5 likely technical questions with model answers
2. 3 behavioral questions with STAR-format answers
3. Questions the candidate should ask the interviewer
4. Tips specific to this company/role

Be specific and actionable.`;

    return await callLLM("", prompt, { temperature: 0.7, maxTokens: 4096 });
}
