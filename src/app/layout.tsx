import type { Metadata } from "next";
import "./globals.css";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";

export const metadata: Metadata = {
    title: "HireKit — AI Job Assistant",
    description: "AI-powered job hunting assistant. Find jobs, build resumes, auto-apply, prepare for interviews.",
    openGraph: {
        title: "HireKit — AI Job Assistant",
        description: "Find jobs. Build resumes. Auto-apply. All through chat.",
        url: "https://megusta.world",
        siteName: "HireKit",
        type: "website",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <link rel="icon" href="/logo.png" />
            </head>
            <body>
                <ChunkErrorBoundary>{children}</ChunkErrorBoundary>
            </body>
        </html>
    );
}
