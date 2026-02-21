import { Router } from "express";
import { upsertProfile, getProfile, getResumes, getApplications } from "../services/database";
import { getUsageSummary } from "../services/subscription";

export const profileRouter = Router();

// GET /api/profile?email=user@example.com
profileRouter.get("/", async (req, res) => {
    try {
        const email = req.query.email as string;
        if (!email) return res.status(400).json({ error: "Email required" });
        const profile = await getProfile(email);
        const usage = await getUsageSummary(email);
        const resumes = await getResumes(email);
        const applications = await getApplications(email);
        res.json({ profile, usage, resumes, applications });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// POST /api/profile — create or update profile
profileRouter.post("/", async (req, res) => {
    try {
        const profile = req.body;
        if (!profile.email) return res.status(400).json({ error: "Email required" });
        const saved = await upsertProfile(profile);
        res.json({ profile: saved });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});
