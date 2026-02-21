import { Router } from "express";
import { authMiddleware } from "../services/auth";
import { getSupabase } from "../services/database";

export const authRouter = Router();

// POST /api/auth/google — first login, save user to DB
authRouter.post("/google", authMiddleware, async (req, res) => {
    try {
        const user = (req as any).user;
        const db = getSupabase();

        // Check if user exists
        const { data: existing } = await db
            .from("users")
            .select("*")
            .eq("email", user.email)
            .single();

        if (!existing) {
            // New user
            await db.from("users").insert({
                email: user.email,
                name: user.name,
                google_id: user.googleId,
                avatar_url: user.avatar,
            });

            await db.from("profiles").insert({
                email: user.email,
                name: user.name,
                avatar_url: user.avatar,
            });

            await db.from("subscriptions").insert({
                email: user.email,
                plan: "free",
                status: "active",
            });
        }

        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// GET /api/auth/me
authRouter.get("/me", authMiddleware, (req, res) => {
    res.json({ user: (req as any).user });
});
