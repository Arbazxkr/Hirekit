"use client";

import { Component } from "react";

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
}

export class ChunkErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Chunk load failure — auto refresh
        if (
            error.message.includes("Loading chunk") ||
            error.message.includes("ChunkLoadError") ||
            error.message.includes("Failed to fetch dynamically imported module") ||
            error.message.includes("Importing a module script failed")
        ) {
            if (typeof window !== "undefined") {
                const reloaded = sessionStorage.getItem("chunk_reload");
                if (!reloaded) {
                    sessionStorage.setItem("chunk_reload", "1");
                    window.location.reload();
                }
            }
        }
        return { hasError: true };
    }

    componentDidCatch() {
        // Clear reload flag after successful recovery
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("chunk_reload");
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    height: "100vh", flexDirection: "column", gap: 16, fontFamily: "Inter, sans-serif",
                }}>
                    <p style={{ fontSize: 16, color: "#555" }}>Something went wrong.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: "10px 24px", borderRadius: 10, border: "none",
                            background: "#111", color: "#fff", fontSize: 14,
                            cursor: "pointer", fontWeight: 600,
                        }}
                    >
                        Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
