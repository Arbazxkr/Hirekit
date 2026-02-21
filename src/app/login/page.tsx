"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: Record<string, unknown>) => void;
                    renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
                };
            };
        };
    }
}

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Already logged in?
        const user = localStorage.getItem("hirekit_user");
        if (user) {
            router.push("/");
            return;
        }

        // Load Google Identity Services
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.onload = () => {
            window.google?.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleLogin,
            });

            const btnEl = document.getElementById("google-btn");
            if (btnEl) {
                window.google?.accounts.id.renderButton(btnEl, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "pill",
                    width: 320,
                });
            }
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGoogleLogin = async (response: { credential: string }) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/google`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${response.credential}`,
                },
                body: JSON.stringify({ idToken: response.credential }),
            });

            if (!res.ok) throw new Error("Login failed");

            const data = await res.json();
            localStorage.setItem("hirekit_user", JSON.stringify(data.user));
            localStorage.setItem("hirekit_token", response.credential);
            router.push("/");
        } catch (err) {
            console.error("Login error:", err);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%)",
        }}>
            <div style={{
                textAlign: "center",
                padding: 48,
                background: "#fff",
                borderRadius: 24,
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                maxWidth: 400,
                width: "90%",
            }}>
                {/* Logo */}
                <img
                    src="/logo.png"
                    alt="HireKit"
                    style={{ width: 64, height: 64, marginBottom: 16 }}
                />

                <h1 style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#111",
                    margin: "0 0 8px",
                }}>
                    HireKit
                </h1>

                <p style={{
                    fontSize: 16,
                    color: "#666",
                    margin: "0 0 32px",
                    lineHeight: 1.5,
                }}>
                    Find jobs. Build resumes. Auto-apply.
                </p>

                {/* Google Sign In */}
                <div
                    id="google-btn"
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: 24,
                    }}
                />

                <p style={{
                    fontSize: 12,
                    color: "#aaa",
                    margin: 0,
                }}>
                    By continuing, you agree to our{" "}
                    <a href="/terms" style={{ color: "#888", textDecoration: "underline" }}>Terms</a>
                    {" "}and{" "}
                    <a href="/privacy" style={{ color: "#888", textDecoration: "underline" }}>Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}
