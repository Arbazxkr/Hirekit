import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { chatRouter } from "./routes/chat";
import { uploadRouter } from "./routes/upload";
import { jobsRouter } from "./routes/jobs";
import { resumeRouter } from "./routes/resume";
import { authRouter } from "./routes/auth";
import { applyRouter } from "./routes/apply";
import { profileRouter } from "./routes/profile";
import { subscriptionRouter } from "./routes/subscription";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Rate limiting — prevent abuse
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: { error: "Too many requests, slow down." },
});

// Middleware
app.set("trust proxy", 1); // Render runs behind a proxy
app.use(cors({
    origin: [
        "https://megusta.world",
        "https://www.megusta.world",
        "http://localhost:3000",
    ],
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(limiter);

// Public routes
app.use("/api/auth", authRouter);
app.use("/api/subscription", subscriptionRouter);

// Core routes
app.use("/api/chat", chatRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/apply", applyRouter);
app.use("/api/profile", profileRouter);

// Health check
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        routes: [
            "POST /api/auth/callback",
            "GET  /api/auth/me",
            "POST /api/chat",
            "POST /api/upload",
            "GET  /api/jobs?query=&location=",
            "POST /api/resume",
            "POST /api/resume/score",
            "POST /api/apply",
            "GET  /api/apply/track?email=",
            "GET  /api/profile?email=",
            "POST /api/profile",
            "GET  /api/subscription",
            "POST /api/subscription/upgrade",
            "GET  /api/subscription/plans",
        ],
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 HireKit Server — Port ${PORT}\n`);
    console.log(`   GET  /api/health          → Status check`);
    console.log(`   POST /api/auth/callback   → Google OAuth`);
    console.log(`   POST /api/chat            → AI chat`);
    console.log(`   POST /api/upload          → File upload`);
    console.log(`   GET  /api/jobs            → Job search`);
    console.log(`   POST /api/resume          → Resume builder`);
    console.log(`   POST /api/resume/score    → ATS scoring`);
    console.log(`   POST /api/apply           → Auto-apply`);
    console.log(`   GET  /api/apply/track     → Application tracker`);
    console.log(`   GET  /api/subscription    → Plan + usage`);
    console.log(`   GET  /api/subscription/plans → Available plans\n`);
});
