"use client";

import { useRef, useState } from "react";

type ResumePreviewProps = {
    resumeText: string;
};

function parseResume(text: string) {
    const sections: { heading: string; content: string[] }[] = [];
    let current: { heading: string; content: string[] } | null = null;

    const lines = text.split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Detect section headers (ALL CAPS, or **bold**, or ending with :)
        const isHeader =
            /^#{1,3}\s+/.test(trimmed) ||
            /^[A-Z\s]{4,}$/.test(trimmed) ||
            /^\*\*[^*]+\*\*$/.test(trimmed) ||
            (/^[A-Z]/.test(trimmed) && trimmed.endsWith(":") && trimmed.length < 40);

        if (isHeader) {
            const clean = trimmed.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/:$/, "").trim();
            current = { heading: clean, content: [] };
            sections.push(current);
        } else if (current) {
            current.content.push(trimmed.replace(/^[-•*]\s*/, "").replace(/\*\*/g, ""));
        } else {
            current = { heading: "", content: [trimmed.replace(/\*\*/g, "")] };
            sections.push(current);
        }
    }
    return sections;
}

export function ResumePreview({ resumeText }: ResumePreviewProps) {
    const resumeRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const sections = parseResume(resumeText);

    const downloadPDF = async () => {
        if (!resumeRef.current) return;
        setDownloading(true);

        try {
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");

            const canvas = await html2canvas(resumeRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#fff",
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save("HireKit-Resume.pdf");
        } catch (err) {
            console.error("PDF error:", err);
        }
        setDownloading(false);
    };

    const downloadImage = async () => {
        if (!resumeRef.current) return;
        setDownloading(true);

        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(resumeRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#fff",
            });

            const link = document.createElement("a");
            link.download = "HireKit-Resume.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (err) {
            console.error("Image error:", err);
        }
        setDownloading(false);
    };

    return (
        <div style={{ marginTop: 12 }}>
            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button onClick={downloadPDF} disabled={downloading} style={{
                    padding: "8px 16px", fontSize: 13, fontWeight: 500,
                    background: "#111", color: "#fff", border: "none",
                    borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                    opacity: downloading ? 0.5 : 1,
                }}>
                    📄 Download PDF
                </button>
                <button onClick={downloadImage} disabled={downloading} style={{
                    padding: "8px 16px", fontSize: 13, fontWeight: 500,
                    background: "#fff", color: "#333", border: "1px solid #ddd",
                    borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                    opacity: downloading ? 0.5 : 1,
                }}>
                    🖼️ Download Image
                </button>
            </div>

            {/* Resume preview */}
            <div style={{
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
                <div ref={resumeRef} style={{
                    background: "#fff",
                    padding: "40px 48px",
                    fontFamily: "'Times New Roman', Georgia, serif",
                    color: "#222",
                    lineHeight: 1.5,
                    maxWidth: 700,
                }}>
                    {sections.map((section, i) => (
                        <div key={i} style={{ marginBottom: 14 }}>
                            {section.heading && (
                                <div style={{
                                    fontSize: i === 0 ? 22 : 13,
                                    fontWeight: i === 0 ? 700 : 600,
                                    textTransform: i === 0 ? "none" : "uppercase",
                                    letterSpacing: i === 0 ? 0 : 1.5,
                                    borderBottom: i === 0 ? "none" : "1px solid #ccc",
                                    paddingBottom: i === 0 ? 0 : 3,
                                    marginBottom: 6,
                                    color: "#111",
                                }}>
                                    {section.heading}
                                </div>
                            )}
                            {section.content.map((line, j) => (
                                <div key={j} style={{
                                    fontSize: 13,
                                    marginBottom: 3,
                                    paddingLeft: section.heading && i > 0 ? 0 : 0,
                                }}>
                                    {line.startsWith("•") || line.startsWith("-") ? line : (i > 0 && section.content.length > 1 ? `• ${line}` : line)}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Check if a message looks like a resume
export function isResumeContent(text: string): boolean {
    const indicators = ["experience", "education", "skills", "summary", "objective", "contact", "projects", "certifications"];
    const lower = text.toLowerCase();
    let matches = 0;
    for (const ind of indicators) {
        if (lower.includes(ind)) matches++;
    }
    return matches >= 3 && text.length > 200;
}
