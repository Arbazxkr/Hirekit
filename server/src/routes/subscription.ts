import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { authMiddleware } from "../services/auth";
import { getUsageSummary } from "../services/subscription";
import { getSupabase } from "../services/database";

export const subscriptionRouter = Router();

function getRazorpay(): Razorpay {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) throw new Error("Razorpay credentials not set in env");
    return new Razorpay({ key_id, key_secret });
}

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
    pro: { amount: 49900, name: "HireKit Pro" },       // ₹499
    premium: { amount: 99900, name: "HireKit Premium" }, // ₹999
};

// GET /api/subscription — get current plan + usage
subscriptionRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const email = ((req as unknown as Record<string, Record<string, string>>).user).email;
        const summary = await getUsageSummary(email);
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// POST /api/subscription/checkout — create Razorpay payment link
subscriptionRouter.post("/checkout", async (req, res) => {
    try {
        const { plan, email } = req.body;

        if (!plan || !PLAN_PRICES[plan]) {
            return res.status(400).json({ error: "Plan must be 'pro' or 'premium'" });
        }
        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const razorpay = getRazorpay();
        const priceInfo = PLAN_PRICES[plan];

        const paymentLink = await razorpay.paymentLink.create({
            amount: priceInfo.amount,
            currency: "INR",
            accept_partial: false,
            description: priceInfo.name,
            customer: { email },
            notify: { email: true },
            reminder_enable: true,
            notes: { plan, email },
            callback_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/?upgraded=true`,
            callback_method: "get"
        });

        res.json({ url: paymentLink.short_url });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// POST /api/subscription/webhook — Razorpay webhook
subscriptionRouter.post("/webhook", async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            return res.status(500).json({ error: "Webhook secret not configured" });
        }

        const sig = req.headers["x-razorpay-signature"] as string;
        const body = JSON.stringify(req.body);

        const expectedSig = crypto.createHmac("sha256", secret).update(body).digest("hex");

        if (sig !== expectedSig) {
            return res.status(400).json({ error: "Invalid signature" });
        }

        const db = getSupabase();
        const event = req.body;

        if (event.event === "payment_link.paid") {
            const paymentLink = event.payload.payment_link.entity;
            const email = paymentLink.customer?.email || paymentLink.notes?.email;
            const plan = paymentLink.notes?.plan || "pro";

            if (email) {
                const periodEnd = new Date();
                periodEnd.setDate(periodEnd.getDate() + 30);

                await db
                    .from("subscriptions")
                    .update({
                        plan,
                        status: "active",
                        stripe_customer_id: paymentLink.id, // Storing razorpay ID here temporarily to avoid schema changes
                        stripe_subscription_id: paymentLink.order_id,
                        current_period_end: periodEnd.toISOString(),
                    })
                    .eq("email", email);
            }
        }

        res.json({ received: true });
    } catch (err) {
        res.status(400).json({ error: (err as Error).message });
    }
});

// POST /api/subscription/upgrade — direct upgrade (fallback)
subscriptionRouter.post("/upgrade", authMiddleware, async (req, res) => {
    try {
        const email = ((req as unknown as Record<string, Record<string, string>>).user).email;
        const { plan } = req.body;

        if (!["pro", "premium"].includes(plan)) {
            return res.status(400).json({ error: "Plan must be 'pro' or 'premium'" });
        }

        const db = getSupabase();
        await db.from("subscriptions").update({ plan, status: "active" }).eq("email", email);

        res.json({ message: `Upgraded to ${plan}!` });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// GET /api/subscription/plans — list plans
subscriptionRouter.get("/plans", (_req, res) => {
    res.json({
        plans: [
            {
                id: "free", name: "Free", price: 0, currency: "INR",
                features: ["5 AI chats/day", "1 resume", "2 uploads/day", "No auto-apply"],
            },
            {
                id: "pro", name: "Pro", price: 499, currency: "INR",
                features: ["100 AI chats/day", "20 resumes/day", "50 uploads/day", "20 auto-applies/day", "ATS scoring"],
            },
            {
                id: "premium", name: "Premium", price: 999, currency: "INR",
                features: ["Unlimited chats", "Unlimited resumes", "Unlimited uploads", "Unlimited auto-applies", "Interview coaching"],
            },
        ],
    });
});
