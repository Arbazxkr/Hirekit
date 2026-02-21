import { Router } from "express";
import { generateResume, scoreResume } from "../services/gemini";

export const resumeRouter = Router();

// POST /api/resume
resumeRouter.post("/", async (req, res) => {
    try {
        const { profile, jobTitle, jobDescription, format = "text" } = req.body;

        if (!profile) {
            return res.status(400).json({ error: "Profile required" });
        }

        const resume = await generateResume(profile, jobTitle || "Software Developer", jobDescription);

        res.json({ resume, format });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// POST /api/resume/score
resumeRouter.post("/score", async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;

        if (!resumeText || !jobDescription) {
            return res.status(400).json({ error: "Both resumeText and jobDescription required" });
        }

        const result = await scoreResume(resumeText, jobDescription);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});
