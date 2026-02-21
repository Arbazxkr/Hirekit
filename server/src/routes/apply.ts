import { Router } from "express";
import { autoApply } from "../services/autoapply";
import { getApplications, updateApplicationStatus } from "../services/database";

export const applyRouter = Router();

// POST /api/apply — auto-apply to a job
applyRouter.post("/", async (req, res) => {
    try {
        const { jobUrl, jobTitle, company, userEmail, profile } = req.body;

        if (!jobUrl || !jobTitle || !company || !userEmail || !profile) {
            return res.status(400).json({
                error: "jobUrl, jobTitle, company, userEmail, and profile required",
            });
        }

        const result = await autoApply({
            jobUrl,
            jobTitle,
            company,
            userEmail,
            profile,
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// GET /api/apply/track?email=user@example.com — get all applications
applyRouter.get("/track", async (req, res) => {
    try {
        const email = req.query.email as string;
        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }
        const applications = await getApplications(email);
        res.json({ applications });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// PATCH /api/apply/:id — update application status
applyRouter.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: "Status required" });
        }
        const updated = await updateApplicationStatus(id, status);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});
