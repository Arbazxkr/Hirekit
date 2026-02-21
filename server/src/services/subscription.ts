import { getSupabase } from "./database";

// Plan limits
const PLAN_LIMITS = {
    free: { chats: 5, applies: 0, resumes: 1, uploads: 2 },
    pro: { chats: 100, applies: 10, resumes: 20, uploads: 50 },
    premium: { chats: -1, applies: -1, resumes: -1, uploads: -1 }, // -1 = unlimited
};

export type PlanType = "free" | "pro" | "premium";

// Get user's plan
export async function getUserPlan(email: string): Promise<PlanType> {
    const db = getSupabase();
    const { data } = await db
        .from("subscriptions")
        .select("plan, status")
        .eq("email", email)
        .eq("status", "active")
        .single();

    return (data?.plan as PlanType) || "free";
}

// Check if user can perform action
export async function checkUsage(
    email: string,
    action: "chat" | "apply" | "resume" | "upload",
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const plan = await getUserPlan(email);
    const limits = PLAN_LIMITS[plan];
    const limitKey = `${action}s` as keyof typeof limits;
    const limit = limits[limitKey];

    // Unlimited
    if (limit === -1) return { allowed: true, remaining: -1, limit: -1 };

    const db = getSupabase();
    const today = new Date().toISOString().split("T")[0];

    // Get or create today's usage
    const { data: usage } = await db
        .from("usage")
        .select("*")
        .eq("email", email)
        .eq("date", today)
        .single();

    const countKey = `${action}_count` as string;
    const currentCount = usage ? (usage as any)[countKey] || 0 : 0;

    return {
        allowed: currentCount < limit,
        remaining: Math.max(0, limit - currentCount),
        limit,
    };
}

// Increment usage counter
export async function incrementUsage(
    email: string,
    action: "chat" | "apply" | "resume" | "upload",
): Promise<void> {
    const db = getSupabase();
    const today = new Date().toISOString().split("T")[0];
    const countKey = `${action}_count`;

    // Upsert: create row if doesn't exist, increment if it does
    const { data: existing } = await db
        .from("usage")
        .select("*")
        .eq("email", email)
        .eq("date", today)
        .single();

    if (existing) {
        await db
            .from("usage")
            .update({ [countKey]: ((existing as any)[countKey] || 0) + 1 })
            .eq("id", (existing as any).id);
    } else {
        await db.from("usage").insert({
            email,
            date: today,
            [countKey]: 1,
        });
    }
}

// Get usage summary for user
export async function getUsageSummary(email: string) {
    const plan = await getUserPlan(email);
    const limits = PLAN_LIMITS[plan];

    const db = getSupabase();
    const today = new Date().toISOString().split("T")[0];

    const { data: usage } = await db
        .from("usage")
        .select("*")
        .eq("email", email)
        .eq("date", today)
        .single();

    return {
        plan,
        today: {
            chats: { used: usage?.chat_count || 0, limit: limits.chats },
            applies: { used: usage?.apply_count || 0, limit: limits.applies },
            resumes: { used: usage?.resume_count || 0, limit: limits.resumes },
            uploads: { used: usage?.upload_count || 0, limit: limits.uploads },
        },
    };
}
