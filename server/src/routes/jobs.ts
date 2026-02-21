import { Router } from "express";

export const jobsRouter = Router();

// GET /api/jobs?query=react+developer&location=bangalore&page=1
jobsRouter.get("/", async (req, res) => {
    try {
        const { query, location, page = "1" } = req.query;

        if (!query) {
            return res.status(400).json({ error: "Query required (e.g. ?query=react+developer)" });
        }

        const appId = process.env.ADZUNA_APP_ID;
        const appKey = process.env.ADZUNA_APP_KEY;

        // If Adzuna keys not set, use Gemini to suggest jobs
        if (!appId || !appKey || appId === "your_adzuna_app_id") {
            const { callGemini } = require("../services/gemini");
            const response = await callGemini(
                `Find real job listings for "${query}" in "${location || "India"}". List 5-8 specific jobs with company name, role, salary range, location, and a link where they can apply. Be specific and use real companies.`,
            );
            return res.json({
                source: "ai",
                results: [],
                aiSuggestion: response,
            });
        }

        // Use Adzuna API for real listings
        const country = "in"; // India
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=10&what=${encodeURIComponent(query as string)}${location ? `&where=${encodeURIComponent(location as string)}` : ""}`;

        const apiRes = await fetch(url);
        if (!apiRes.ok) {
            throw new Error(`Adzuna error: ${apiRes.status}`);
        }

        const data: any = await apiRes.json();

        const results = (data.results || []).map((job: any) => ({
            id: job.id,
            title: job.title,
            company: job.company?.display_name || "Unknown",
            location: job.location?.display_name || "",
            salary: job.salary_min
                ? `₹${Math.round(job.salary_min / 1000)}K - ₹${Math.round(job.salary_max / 1000)}K`
                : "Not disclosed",
            description: job.description?.slice(0, 200) + "...",
            url: job.redirect_url,
            posted: job.created,
        }));

        res.json({
            source: "adzuna",
            total: data.count || 0,
            page: Number(page),
            results,
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});
