import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service — HireKit",
    description: "HireKit Terms of Service. Rules and conditions for using our AI job assistant.",
};

export default function Terms() {
    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px 80px", fontFamily: "Inter, sans-serif", color: "#333", lineHeight: 1.9 }}>
            <a href="/" style={{ color: "#3b82f6", textDecoration: "none", fontSize: 14 }}>← Back to HireKit</a>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: "24px 0 8px" }}>Terms of Service</h1>
            <p style={{ color: "#888", fontSize: 14 }}>Effective Date: February 22, 2026 &nbsp;|&nbsp; Last Updated: February 22, 2026</p>

            <p>These Terms of Service (&ldquo;Terms&rdquo;) govern your use of HireKit, operated at megusta.world. By using HireKit, you agree to these Terms.</p>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>1. Service Description</h2>
            <p>HireKit is an AI-powered job hunting assistant that provides the following services through a chat interface:</p>
            <ul>
                <li>Job search across multiple job boards</li>
                <li>AI-generated resumes customized for specific jobs</li>
                <li>ATS (Applicant Tracking System) resume scoring</li>
                <li>AI-generated cover letters</li>
                <li>Interview preparation with AI coaching</li>
                <li>Automated job application submission (auto-apply)</li>
                <li>Job application tracking</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>2. Account & Eligibility</h2>
            <ul>
                <li>You must be at least 16 years old to use HireKit</li>
                <li>You must sign in with a valid Google account</li>
                <li>You are responsible for all activity under your account</li>
                <li>One account per person — multiple accounts may be terminated</li>
                <li>You must provide accurate profile information</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>3. Subscription Plans</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 14 }}>
                <thead>
                    <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                        <th style={{ padding: "8px 12px" }}>Feature</th>
                        <th style={{ padding: "8px 12px" }}>Free</th>
                        <th style={{ padding: "8px 12px" }}>Pro (₹499/mo)</th>
                        <th style={{ padding: "8px 12px" }}>Premium (₹999/mo)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "8px 12px" }}>AI Chats/day</td>
                        <td style={{ padding: "8px 12px" }}>5</td>
                        <td style={{ padding: "8px 12px" }}>100</td>
                        <td style={{ padding: "8px 12px" }}>Unlimited</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "8px 12px" }}>Auto-Applies/day</td>
                        <td style={{ padding: "8px 12px" }}>0</td>
                        <td style={{ padding: "8px 12px" }}>20</td>
                        <td style={{ padding: "8px 12px" }}>Unlimited</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "8px 12px" }}>Resumes/day</td>
                        <td style={{ padding: "8px 12px" }}>1</td>
                        <td style={{ padding: "8px 12px" }}>10</td>
                        <td style={{ padding: "8px 12px" }}>Unlimited</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "8px 12px" }}>Job Locations</td>
                        <td style={{ padding: "8px 12px" }}>India only</td>
                        <td style={{ padding: "8px 12px" }}>India + Gulf + Remote</td>
                        <td style={{ padding: "8px 12px" }}>All countries</td>
                    </tr>
                </tbody>
            </table>
            <ul style={{ marginTop: 12 }}>
                <li>Subscriptions are billed monthly through Stripe</li>
                <li>Subscriptions auto-renew unless cancelled before the next billing date</li>
                <li>You can cancel anytime — access continues until the end of the billing period</li>
                <li>Prices are in Indian Rupees (₹) and include applicable taxes</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>4. Refund Policy</h2>
            <ul>
                <li>Refund requests must be made within 7 days of purchase</li>
                <li>Refunds are granted if you have used fewer than 10 AI interactions during the current billing period</li>
                <li>To request a refund, email support@megusta.world with your account email and reason</li>
                <li>Refunds are processed within 5–10 business days via Stripe</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>5. AI-Generated Content</h2>
            <ul>
                <li>HireKit uses Google Gemini AI to generate resumes, cover letters, and interview content</li>
                <li><strong>AI can make mistakes.</strong> You must review all AI-generated content before using it professionally</li>
                <li>We are not responsible for inaccuracies in AI-generated resumes, cover letters, or interview advice</li>
                <li>You own the content generated for you (resumes, cover letters), but we retain the right to use anonymized data to improve our service</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>6. Auto-Apply</h2>
            <ul>
                <li>Auto-apply submits job applications on your behalf using the profile information you provide</li>
                <li>We are <strong>not</strong> an employment agency — we are a tool that assists with applications</li>
                <li>We do not guarantee that any application will be accepted, reviewed, or result in employment</li>
                <li>You are solely responsible for the accuracy of the personal information submitted with applications</li>
                <li>We are not liable for any consequences of automated applications (e.g., duplicate applications, employer policies against automated submissions)</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>7. Acceptable Use</h2>
            <p>You agree <strong>not</strong> to:</p>
            <ul>
                <li>Use HireKit for spam, fraud, or deceptive applications</li>
                <li>Submit false or misleading profile information</li>
                <li>Attempt to circumvent usage limits or subscription restrictions</li>
                <li>Use automated scripts, bots, or scrapers to access HireKit</li>
                <li>Reverse-engineer, copy, or redistribute any part of HireKit</li>
                <li>Violate any applicable laws while using the service</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>8. Account Termination</h2>
            <ul>
                <li>You may delete your account at any time by contacting support</li>
                <li>We may suspend or terminate accounts that violate these Terms</li>
                <li>Upon termination, your data will be deleted within 30 days (except as required by law)</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>9. Limitation of Liability</h2>
            <p>HireKit is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum extent permitted by law:</p>
            <ul>
                <li>We are not liable for job outcomes, interview results, or employment decisions</li>
                <li>We are not liable for errors in AI-generated content</li>
                <li>We are not liable for third-party job site outages or changes that affect auto-apply</li>
                <li>Our total liability shall not exceed the amount you paid for the service in the past 12 months</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>10. Intellectual Property</h2>
            <ul>
                <li>HireKit, its logo, design, and code are our intellectual property</li>
                <li>Resumes and cover letters generated for you belong to you</li>
                <li>By uploading documents, you grant us a limited license to process them for service delivery</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>11. Changes to Terms</h2>
            <p>We may modify these Terms at any time. We will notify you of material changes via the app or email. Continued use after changes constitutes acceptance.</p>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>12. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Any disputes shall be resolved in the courts of [Your City], India.</p>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>13. Contact</h2>
            <p>
                HireKit<br />
                Email: <strong>support@megusta.world</strong><br />
                Website: <strong>megusta.world</strong>
            </p>

            <div style={{ marginTop: 48, borderTop: "1px solid #eee", paddingTop: 20 }}>
                <a href="/" style={{ color: "#3b82f6", textDecoration: "none", fontSize: 14 }}>← Back to HireKit</a>
                &nbsp;&nbsp;&nbsp;
                <a href="/privacy" style={{ color: "#3b82f6", textDecoration: "none", fontSize: 14 }}>Privacy Policy →</a>
            </div>
        </div>
    );
}
