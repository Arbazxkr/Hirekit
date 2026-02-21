import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy — HireKit",
    description: "HireKit Privacy Policy. How we collect, use, and protect your data.",
};

export default function Privacy() {
    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px 80px", fontFamily: "Inter, sans-serif", color: "#333", lineHeight: 1.9 }}>
            <a href="/" style={{ color: "#3b82f6", textDecoration: "none", fontSize: 14 }}>← Back to HireKit</a>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: "24px 0 8px" }}>Privacy Policy</h1>
            <p style={{ color: "#888", fontSize: 14 }}>Effective Date: February 22, 2026 &nbsp;|&nbsp; Last Updated: February 22, 2026</p>

            <p>HireKit (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the website megusta.world and the HireKit application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.</p>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>1. Information We Collect</h2>

            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 16 }}>1.1 Information You Provide</h3>
            <ul>
                <li><strong>Account Information:</strong> When you sign in with Google, we receive your name, email address, and profile picture from Google.</li>
                <li><strong>Profile Data:</strong> Profession, skills, years of experience, education, target job role, location preference, and any other career information you share through chat.</li>
                <li><strong>Uploaded Documents:</strong> Resumes, CVs, certificates, and other files you upload for processing.</li>
                <li><strong>Chat Content:</strong> Messages you send and AI responses are stored to maintain conversation context and improve your experience.</li>
                <li><strong>Payment Information:</strong> When you subscribe to a paid plan, payment is processed through Stripe. We do not store your credit card details — Stripe handles this securely.</li>
            </ul>

            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 16 }}>1.2 Information Collected Automatically</h3>
            <ul>
                <li><strong>Usage Data:</strong> Daily chat count, number of resumes generated, auto-applies used, and file uploads — tracked for plan limit enforcement.</li>
                <li><strong>Application Records:</strong> Jobs you apply to, company names, application status, and timestamps.</li>
                <li><strong>Log Data:</strong> IP address, browser type, device type, and pages visited (standard web server logs).</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>2. How We Use Your Information</h2>
            <ul>
                <li>To provide and personalize the HireKit service (job search, resume building, auto-apply, interview prep)</li>
                <li>To maintain your profile and remember your preferences across sessions</li>
                <li>To generate customized resumes, cover letters, and interview preparation content</li>
                <li>To submit job applications on your behalf when you use auto-apply</li>
                <li>To process subscription payments and manage your account</li>
                <li>To enforce daily usage limits based on your subscription plan</li>
                <li>To improve our AI models and service quality</li>
                <li>To communicate with you about your account, service updates, or support requests</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>3. How We Share Your Information</h2>
            <p>We do <strong>not</strong> sell your personal data. We share information only with:</p>
            <ul>
                <li><strong>Google:</strong> For authentication (OAuth sign-in)</li>
                <li><strong>Google Gemini API:</strong> Your chat messages and profile data are sent to Google&apos;s AI to generate responses. Google&apos;s AI data usage policy applies.</li>
                <li><strong>Adzuna:</strong> Job search queries (anonymized — no personal data sent)</li>
                <li><strong>Stripe:</strong> Email address for payment processing</li>
                <li><strong>Job Websites:</strong> When you use auto-apply, your name, email, and profile information are submitted to job application forms on third-party websites</li>
                <li><strong>Supabase:</strong> Our database provider where your data is stored (hosted on AWS)</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>4. Data Storage & Security</h2>
            <ul>
                <li>Data is stored on Supabase servers (AWS infrastructure, Asia-Pacific region)</li>
                <li>All data is transmitted over HTTPS (TLS encryption)</li>
                <li>We use Google&apos;s OAuth 2.0 — we never see or store your Google password</li>
                <li>Database access is restricted to server-side operations only</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>5. Data Retention</h2>
            <ul>
                <li><strong>Account data:</strong> Retained while your account is active</li>
                <li><strong>Chat history:</strong> Retained for 1 year, then automatically deleted</li>
                <li><strong>Application records:</strong> Retained for 2 years for your reference</li>
                <li><strong>Uploaded files:</strong> Text is extracted and stored; original files are not retained after processing</li>
            </ul>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
                <li><strong>Access:</strong> Request a copy of all data we hold about you</li>
                <li><strong>Correction:</strong> Update or correct your profile information at any time through chat</li>
                <li><strong>Deletion:</strong> Request complete deletion of your account and all associated data</li>
                <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
                <li><strong>Objection:</strong> Opt out of AI processing of your data</li>
            </ul>
            <p>To exercise any of these rights, email <strong>support@megusta.world</strong>. We will respond within 30 days.</p>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>7. Children&apos;s Privacy</h2>
            <p>HireKit is not intended for users under 16 years of age. We do not knowingly collect data from children.</p>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>8. Cookies</h2>
            <p>We use localStorage to maintain your login session. We do not use third-party tracking cookies or advertising cookies.</p>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &ldquo;Last Updated&rdquo; date. Continued use of HireKit after changes constitutes acceptance.</p>

            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>10. Contact Us</h2>
            <p>
                HireKit<br />
                Email: <strong>support@megusta.world</strong><br />
                Website: <strong>megusta.world</strong>
            </p>

            <div style={{ marginTop: 48, borderTop: "1px solid #eee", paddingTop: 20 }}>
                <a href="/" style={{ color: "#3b82f6", textDecoration: "none", fontSize: 14 }}>← Back to HireKit</a>
                &nbsp;&nbsp;&nbsp;
                <a href="/terms" style={{ color: "#3b82f6", textDecoration: "none", fontSize: 14 }}>Terms of Service →</a>
            </div>
        </div>
    );
}
