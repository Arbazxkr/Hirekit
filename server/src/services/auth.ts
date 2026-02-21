import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Verify Google token on every request
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        const idToken = header.split(" ")[1];
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) throw new Error("Invalid token");

        (req as any).user = {
            googleId: payload.sub,
            email: payload.email!,
            name: payload.name || payload.email!,
            avatar: payload.picture || "",
        };

        next();
    } catch {
        return res.status(401).json({ error: "Invalid Google token" });
    }
}
