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
- If user wants to build a resume but hasn't shared their education/certifications → ask about it
- If user uploads a document, extract ALL useful info from it and fill their profile
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

SAVE_PROFILE — when user describes themselves OR when you extract info from uploaded document
data: { profession, years_experience, skills[], job_location_preference, target_role, target_location, education, resume_text }

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

export async function callGemini(
    message: string,
    history: Message[] = [],
    userContext?: UserContext,
): Promise<GeminiResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
        throw new Error("GEMINI_API_KEY not configured");
    }

    const systemPrompt = buildSystemPrompt(
        userContext || { profile: null, plan: "free", chatsRemaining: 5, appliesRemaining: 0 },
    );

    const contents = [
        ...history.slice(-20).map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        })),
        { role: "user", parts: [{ text: message }] },
    ];

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                    responseMimeType: "application/json",
                },
            }),
        },
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini error: ${err.slice(0, 200)}`);
    }

    const raw: Record<string, unknown> = await res.json();
    const text =
        ((raw as Record<string, Array<{ content: { parts: Array<{ text: string }> } }>>)
            .candidates?.[0]?.content?.parts?.[0]?.text) || "";

    // Parse JSON response
    try {
        const parsed = JSON.parse(text) as GeminiResponse;
        return {
            message: parsed.message || "I'm not sure how to help with that.",
            action: parsed.action || "NONE",
            data: parsed.data || {},
        };
    } catch {
        // If Gemini didn't return valid JSON, wrap it
        return { message: text || "Something went wrong.", action: "NONE", data: {} };
    }
}

export async function callGeminiVision(
    prompt: string,
    imageBase64: string,
    mimeType: string,
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
        throw new Error("GEMINI_API_KEY not configured");
    }

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

// Generate resume
export async function generateResume(
    profile: Record<string, unknown>,
    jobTitle: string,
    jobDescription?: string,
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY!;
    const prompt = `Generate a professional, ATS-friendly resume for:
PROFILE: ${JSON.stringify(profile)}
TARGET JOB: ${jobTitle}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}` : ""}

RULES:
- Detect the person's profession and adapt the resume format accordingly
- For tech roles: use sections CONTACT, SUMMARY, EXPERIENCE, EDUCATION, SKILLS, PROJECTS
- For hospitality (waiter, barista, chef, hotel): use CONTACT, SUMMARY, EXPERIENCE, SKILLS, CERTIFICATIONS (food safety, HACCP, etc.)
- For healthcare (nurse, caregiver): use CONTACT, SUMMARY, EXPERIENCE, LICENSES & CERTIFICATIONS, SKILLS, EDUCATION
- For blue collar (driver, electrician, welder): use CONTACT, SUMMARY, EXPERIENCE, LICENSES, SKILLS, SAFETY TRAINING
- For retail/office: use CONTACT, SUMMARY, EXPERIENCE, EDUCATION, SKILLS
- For Gulf jobs: mention visa readiness, passport validity, any Gulf experience
- Use action verbs relevant to the profession (e.g. "served 200+ customers daily" for hospitality, "managed team of 5" for management)
- Include quantified achievements where possible
- Keep to 1 page. Plain text format. ATS-scannable.`;

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
            }),
        },
    );

    const data: Record<string, unknown> = await res.json();
    return (
        ((data as Record<string, Array<{ content: { parts: Array<{ text: string }> } }>>)
            .candidates?.[0]?.content?.parts?.[0]?.text) || "Could not generate resume."
    );
}

// Score resume
export async function scoreResume(
    resumeText: string,
    jobDescription: string,
): Promise<{ score: number; feedback: string[]; missing: string[] }> {
    const apiKey = process.env.GEMINI_API_KEY!;
    const prompt = `Score this resume against the job. Return ONLY JSON:
{"score": 0-100, "feedback": ["point1","point2"], "missing": ["keyword1","keyword2"]}

RESUME:\n${resumeText}\n\nJOB:\n${jobDescription}`;

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 1024, responseMimeType: "application/json" },
            }),
        },
    );

    const data: Record<string, unknown> = await res.json();
    const text =
        ((data as Record<string, Array<{ content: { parts: Array<{ text: string }> } }>>)
            .candidates?.[0]?.content?.parts?.[0]?.text) || '{"score":0,"feedback":[],"missing":[]}';

    try {
        return JSON.parse(text);
    } catch {
        return { score: 0, feedback: ["Could not parse score"], missing: [] };
    }
}

// Generate cover letter
export async function generateCoverLetter(
    profile: Record<string, unknown>,
    jobTitle: string,
    company: string,
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY!;
    const prompt = `Write a professional cover letter for:
PROFILE: ${JSON.stringify(profile)}
JOB: ${jobTitle} at ${company}

Keep it concise (3-4 paragraphs), professional, and tailored.`;

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
            }),
        },
    );

    const data: Record<string, unknown> = await res.json();
    return (
        ((data as Record<string, Array<{ content: { parts: Array<{ text: string }> } }>>)
            .candidates?.[0]?.content?.parts?.[0]?.text) || "Could not generate cover letter."
    );
}

// Interview coaching
export async function interviewCoach(
    profile: Record<string, unknown>,
    jobTitle: string,
    company: string,
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY!;
    const prompt = `Generate interview preparation for:
PROFILE: ${JSON.stringify(profile)}
JOB: ${jobTitle} at ${company}

Include:
1. 5 likely technical questions with model answers
2. 3 behavioral questions with STAR-format answers
3. Questions the candidate should ask the interviewer
4. Tips specific to this company/role

Be specific and actionable.`;

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
            }),
        },
    );

    const data: Record<string, unknown> = await res.json();
    return (
        ((data as Record<string, Array<{ content: { parts: Array<{ text: string }> } }>>)
            .candidates?.[0]?.content?.parts?.[0]?.text) || "Could not generate interview prep."
    );
}
