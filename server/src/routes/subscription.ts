import { Router } from "express";
import Stripe from "stripe";
import { authMiddleware } from "../services/auth";
import { getUsageSummary } from "../services/subscription";
import { getSupabase } from "../services/database";

export const subscriptionRouter = Router();

function getStripe(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    return new Stripe(key);
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

// POST /api/subscription/checkout — create Stripe checkout
subscriptionRouter.post("/checkout", async (req, res) => {
    try {
        const { plan, email } = req.body;

        if (!plan || !PLAN_PRICES[plan]) {
            return res.status(400).json({ error: "Plan must be 'pro' or 'premium'" });
        }
        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const stripe = getStripe();
        const priceInfo = PLAN_PRICES[plan];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: { name: priceInfo.name },
                        unit_amount: priceInfo.amount,
                        recurring: { interval: "month" },
                    },
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/?upgraded=true`,
            cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/`,
            metadata: { plan, email },
        });

        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// POST /api/subscription/webhook — Stripe webhook
subscriptionRouter.post("/webhook", async (req, res) => {
    try {
        const stripe = getStripe();
        const sig = req.headers["stripe-signature"] as string;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            return res.status(500).json({ error: "Webhook secret not configured" });
        }

        const rawBody = JSON.stringify(req.body);
        const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        const db = getSupabase();

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const email = session.metadata?.email || session.customer_email;
                const plan = session.metadata?.plan || "pro";

                if (email) {
                    const periodEnd = new Date();
                    periodEnd.setDate(periodEnd.getDate() + 30);

                    await db
                        .from("subscriptions")
                        .update({
                            plan,
                            status: "active",
                            stripe_customer_id: session.customer as string,
                            stripe_subscription_id: session.subscription as string,
                            current_period_end: periodEnd.toISOString(),
                        })
                        .eq("email", email);
                }
                break;
            }

            case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription;
                const customerId = sub.customer as string;

                await db
                    .from("subscriptions")
                    .update({ plan: "free", status: "cancelled" })
                    .eq("stripe_customer_id", customerId);
                break;
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
