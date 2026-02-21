import { Router } from "express";
import { callGemini, generateResume, scoreResume, generateCoverLetter, interviewCoach, GeminiResponse } from "../services/gemini";
import { checkUsage, incrementUsage, getUserPlan, getUsageSummary } from "../services/subscription";
import { getProfile, upsertProfile, getApplications, saveChatMessage } from "../services/database";
import { autoApply } from "../services/autoapply";

export const chatRouter = Router();

// POST /api/chat
chatRouter.post("/", async (req, res) => {
    try {
        const { message, history, email, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message required" });
        }

        // --- Usage check ---
        if (email) {
            const usage = await checkUsage(email, "chat");
            if (!usage.allowed) {
                return res.json({
                    message: "You've used all your chats today. Upgrade to Pro for 100 chats/day! 🚀",
                    action: "SHOW_PLAN",
                    result: { reason: "chat_limit" },
                });
            }
        }

        // --- Build context ---
        const profile = email ? await getProfile(email) : null;
        const plan = email ? await getUserPlan(email) : "free";

        let chatsRemaining = 5;
        let appliesRemaining = 0;
        if (email) {
            const chatUsage = await checkUsage(email, "chat");
            const applyUsage = await checkUsage(email, "apply");
            chatsRemaining = chatUsage.remaining;
            appliesRemaining = applyUsage.remaining;
        }

        // --- Call Gemini ---
        const aiResponse: GeminiResponse = await callGemini(
            message,
            history || [],
            { profile, plan, chatsRemaining, appliesRemaining },
        );

        let result: unknown = null;

        // --- Handle actions ---
        switch (aiResponse.action) {
            case "SAVE_PROFILE": {
                if (email) {
                    const data = aiResponse.data as Record<string, unknown>;
                    await upsertProfile({
                        email,
                        name: String(data.name || profile?.name || ""),
                        skills: (data.skills as string[]) || (profile?.skills as string[]) || [],
                        experience: String(data.years_experience || profile?.experience || ""),
                        education: String(data.education || profile?.education || ""),
                        location: String(data.target_location || profile?.location || ""),
                        target_role: String(data.target_role || data.profession || profile?.target_role || ""),
                        resume_text: String(data.resume_text || profile?.resume_text || ""),
                    });
                    result = { saved: true };
                }
                break;
            }

            case "SEARCH_JOBS": {
                const data = aiResponse.data as { query?: string; location?: string };
                const query = data.query || (profile?.target_role as string) || "";
                const location = data.location || (profile?.location as string) || "";

                try {
                    const appId = process.env.ADZUNA_APP_ID;
                    const appKey = process.env.ADZUNA_APP_KEY;

                    if (appId && appKey && appId !== "your_adzuna_app_id") {
                        const country = location.toLowerCase().includes("india") ? "in" : "gb";
                        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=8&what=${encodeURIComponent(query)}${location ? `&where=${encodeURIComponent(location)}` : ""}`;
                        const jobRes = await fetch(url);
                        const jobData: Record<string, unknown> = await jobRes.json();
                        const results = ((jobData.results || []) as Array<Record<string, unknown>>).map((job) => ({
                            id: job.id,
                            title: job.title,
                            company: (job.company as Record<string, string>)?.display_name || "Unknown",
                            location: (job.location as Record<string, string>)?.display_name || "",
                            salary_min: job.salary_min,
                            salary_max: job.salary_max,
                            description: String(job.description || "").slice(0, 200),
                            url: job.redirect_url,
                            posted: job.created,
                        }));
                        result = { jobs: results, source: "adzuna" };
                    } else {
                        result = { jobs: [], source: "none", note: "Job search API not configured" };
                    }
                } catch {
                    result = { jobs: [], source: "error" };
                }
                break;
            }

            case "BUILD_RESUME": {
                if (profile) {
                    const data = aiResponse.data as { job_title?: string; job_description?: string };
                    const resume = await generateResume(
                        profile,
                        data.job_title || (profile.target_role as string) || "Software Developer",
                        data.job_description,
                    );
                    if (email) await incrementUsage(email, "resume");
                    result = { resume };
                } else {
                    aiResponse.message = "I need to know about you first! Tell me your profession, skills, and experience.";
                    aiResponse.action = "NONE";
                }
                break;
            }

            case "SCORE_RESUME": {
                const data = aiResponse.data as { job_description?: string };
                const resumeText = (profile?.resume_text as string) || "";
                if (resumeText && data.job_description) {
                    const score = await scoreResume(resumeText, data.job_description);
                    result = score;
                } else {
                    aiResponse.message = "I need your resume and a job description to score. Upload your resume first!";
                    aiResponse.action = "NONE";
                }
                break;
            }

            case "AUTO_APPLY": {
                if (!email) {
                    aiResponse.message = "You need to sign in first to auto-apply!";
                    aiResponse.action = "NONE";
                    break;
                }

                const applyUsage = await checkUsage(email, "apply");
                if (!applyUsage.allowed) {
                    aiResponse.message = "You've used all your auto-applies today. Upgrade for more! 🚀";
                    aiResponse.action = "SHOW_PLAN";
                    result = { reason: "apply_limit" };
                    break;
                }

                const data = aiResponse.data as { job_url?: string };
                if (data.job_url && profile) {
                    const applyResult = await autoApply({
                        jobUrl: data.job_url,
                        jobTitle: (profile.target_role as string) || "",
                        company: "Company",
                        userEmail: email,
                        profile: {
                            name: (profile.name as string) || "",
                            email,
                            phone: (profile.phone as string) || "",
                            location: (profile.location as string) || "",
                        },
                    });
                    if (applyResult.success) await incrementUsage(email, "apply");
                    result = applyResult;
                }
                break;
            }

            case "COVER_LETTER": {
                if (profile) {
                    const data = aiResponse.data as { job_title?: string; company?: string };
                    const letter = await generateCoverLetter(
                        profile,
                        data.job_title || (profile.target_role as string) || "",
                        data.company || "",
                    );
                    result = { coverLetter: letter };
                }
                break;
            }

            case "INTERVIEW_PREP": {
                if (profile) {
                    const data = aiResponse.data as { job_title?: string; company?: string };
                    const prep = await interviewCoach(
                        profile,
                        data.job_title || (profile.target_role as string) || "",
                        data.company || "",
                    );
                    result = { interviewPrep: prep };
                }
                break;
            }

            case "SHOW_APPLICATIONS": {
                if (email) {
                    const apps = await getApplications(email);
                    result = { applications: apps };
                }
                break;
            }

            case "SHOW_PLAN": {
                if (email) {
                    const summary = await getUsageSummary(email);
                    result = summary;
                } else {
                    result = { plan: "free", message: "Sign in to see your plan" };
                }
                break;
            }

            case "UPGRADE_PLAN": {
                result = { redirect: "/api/subscription/checkout" };
                break;
            }

            default:
                break;
        }

        // --- Track usage ---
        if (email) {
            await incrementUsage(email, "chat");
            if (sessionId) {
                await saveChatMessage(email, "user", message, sessionId);
                await saveChatMessage(email, "assistant", aiResponse.message, sessionId);
            }
        }

        res.json({
            message: aiResponse.message,
            action: aiResponse.action,
            result,
        });
    } catch (err) {
        res.status(500).json({
            message: "Something went wrong. Try again!",
            action: "NONE",
            result: null,
            error: (err as Error).message,
        });
    }
});
