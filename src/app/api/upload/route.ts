import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name.toLowerCase();

    try {
        // PDF — extract text
        if (fileName.endsWith(".pdf")) {
            // @ts-expect-error pdf-parse types
            const pdfParse = (await import("pdf-parse")).default ?? (await import("pdf-parse"));
            const data = await pdfParse(buffer);
            return NextResponse.json({
                text: data.text,
                type: "pdf",
                name: file.name,
            });
        }

        // Image — use Gemini Vision to read
        if (fileName.match(/\.(png|jpg|jpeg|webp)$/)) {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
            }

            const base64 = buffer.toString("base64");
            const mimeType = fileName.endsWith(".png") ? "image/png"
                : fileName.endsWith(".webp") ? "image/webp"
                    : "image/jpeg";

            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: "Extract ALL text from this image. If it's a resume, extract every detail — name, contact, experience, education, skills, projects. Return the full text exactly as written." },
                                { inlineData: { mimeType, data: base64 } },
                            ],
                        }],
                        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
                    }),
                },
            );

            if (!res.ok) {
                const err = await res.text();
                return NextResponse.json({ error: `Vision error: ${err.slice(0, 200)}` }, { status: 500 });
            }

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Could not read image.";

            return NextResponse.json({ text, type: "image", name: file.name });
        }

        // Text files
        if (fileName.match(/\.(txt|md|csv)$/)) {
            const text = buffer.toString("utf-8");
            return NextResponse.json({ text, type: "text", name: file.name });
        }

        return NextResponse.json({ error: "Unsupported file type. Use PDF, PNG, JPG, or TXT." }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
