import { Router } from "express";
import multer from "multer";
import { callGeminiVision } from "../services/gemini";

export const uploadRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/upload
uploadRouter.post("/", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const fileName = file.originalname.toLowerCase();

        // PDF
        if (fileName.endsWith(".pdf")) {
            const pdfParse = require("pdf-parse");
            const data = await pdfParse(file.buffer);
            return res.json({ text: data.text, type: "pdf", name: file.originalname });
        }

        // Image — use Gemini Vision
        if (fileName.match(/\.(png|jpg|jpeg|webp)$/)) {
            const base64 = file.buffer.toString("base64");
            const mimeType = fileName.endsWith(".png")
                ? "image/png"
                : fileName.endsWith(".webp")
                    ? "image/webp"
                    : "image/jpeg";

            const text = await callGeminiVision(
                "Extract ALL text from this image. If it's a resume, extract every detail — name, contact, experience, education, skills, projects. Return the full text exactly as written.",
                base64,
                mimeType,
            );

            return res.json({ text, type: "image", name: file.originalname });
        }

        // Text files
        if (fileName.match(/\.(txt|md|csv)$/)) {
            const text = file.buffer.toString("utf-8");
            return res.json({ text, type: "text", name: file.originalname });
        }

        res.status(400).json({ error: "Unsupported file type. Use PDF, PNG, JPG, or TXT." });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});
