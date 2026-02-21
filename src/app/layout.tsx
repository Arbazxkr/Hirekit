import type { Metadata } from "next";
import "./globals.css";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";

export const metadata: Metadata = {
    title: "HireKit — AI Job Assistant",
    description: "Find jobs. Build resumes. Auto-apply. All through chat. AI-powered job hunting assistant for every profession.",
    metadataBase: new URL("https://megusta.world"),
    icons: {
        icon: "/favicon.png",
        apple: "/apple-touch-icon.png",
    },
    openGraph: {
        title: "HireKit — AI Job Assistant",
        description: "Find jobs. Build resumes. Auto-apply. All through chat.",
        url: "https://megusta.world",
        siteName: "HireKit",
        type: "website",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "HireKit — AI Job Assistant",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "HireKit — AI Job Assistant",
        description: "Find jobs. Build resumes. Auto-apply. All through chat.",
        images: ["/og-image.png"],
    },
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body className="antialiased">
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <ChunkErrorBoundary>{children}</ChunkErrorBoundary>
                </ThemeProvider>
            </body>
        </html>
    );
}
