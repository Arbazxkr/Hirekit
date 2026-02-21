import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { message, history } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "Add GEMINI_API_KEY to .env.local" },
            { status: 500 },
        );
    }

    const systemPrompt = `You are HireKit, a friendly and expert AI job application assistant.

YOUR ROLE:
- Help users find jobs, build resumes, prepare for interviews, write cover letters
- When a user first starts, naturally learn about them through conversation (name, skills, experience, what kind of job they want)
- Don't ask too many questions at once — keep it natural, like a helpful friend

WHEN BUILDING RESUMES:
- Ask what job they're applying for
- Ask about their experience, education, skills
- Generate a clean, ATS-friendly resume in plain text format
- Use standard sections: Contact, Summary, Experience, Education, Skills, Projects
- Use bullet points with action verbs
- Include keywords from the job description

WHEN FINDING JOBS:
- Ask what role, location, and experience level
- Suggest relevant job titles, companies, and where to look
- Give specific, actionable advice

WHEN PREPARING FOR INTERVIEWS:
- Ask what company and role
- Give likely interview questions with model answers tailored to them
- Include behavioral, technical, and situational questions

FORMATTING:
- Keep responses conversational but helpful
- Use bullet points and headers when listing things
- Be concise — don't write essays
- Use emojis sparingly for friendliness`;

    const contents = [
        ...(history || []).slice(-20).map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        })),
        { role: "user", parts: [{ text: message }] },
    ];

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
                }),
            },
        );

        if (!res.ok) {
            const err = await res.text();
            return NextResponse.json({ error: err.slice(0, 200) }, { status: res.status });
        }

        const data = await res.json();
        const response = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
        return NextResponse.json({ response });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
