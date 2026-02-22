import { Router } from "express";
import { getProfile, upsertProfile } from "../services/database";
import { checkUsage, getUserPlan } from "../services/subscription";
import { getApplications, getResumes } from "../services/database";

export const profileRouter = Router();

// GET /api/profile
profileRouter.get("/", async (req, res) => {
    try {
        const email = req.query.email as string;
        if (!email) return res.status(400).json({ error: "Email required" });

        const profile = await getProfile(email);
        const resumes = await getResumes(email);
        const applications = await getApplications(email);
        const plan = await getUserPlan(email);
        
        let chatsUsage = { allowed: true, limit: 10, remaining: 10 };
        try {
           chatsUsage = await checkUsage(email, "chat");
        } catch(e){}

        res.json({
            profile: profile || null,
            resumes,
            applications,
            usage: { plan, chatsUsed: chatsUsage.limit - chatsUsage.remaining, chatsLimit: chatsUsage.limit },
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// POST /api/profile
profileRouter.post("/", async (req, res) => {
    try {
        const data = req.body;
        if (!data.email) return res.status(400).json({ error: "Email required" });
        
        // Also allow username updates if provided
        const profileData = {
            email: data.email,
            name: data.name || "",
            skills: data.skills || [],
            experience: data.experience || "",
            education: data.education || "",
            location: data.location || "",
            target_role: data.target_role || "",
        } as any;
        
        if (data.username) profileData.username = data.username;
        if (data.avatar_url) profileData.avatar_url = data.avatar_url;

        const profile = await upsertProfile(profileData);
        res.json({ success: true, profile });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});
