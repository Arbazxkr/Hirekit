import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
    if (!supabase) {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_KEY;
        if (!url || !key || url === "your_supabase_url") {
            throw new Error("SUPABASE_URL and SUPABASE_KEY required in .env");
        }
        supabase = createClient(url, key);
    }
    return supabase;
}

// ─── User Profile ───
export interface UserProfile {
    id?: string;
    email: string;
    name: string;
    username?: string;
    avatar_url?: string;
    skills: string[];
    experience: string;
    education: string;
    location: string;
    target_role: string;
    resume_text?: string;
    created_at?: string;
}

export async function upsertProfile(profile: UserProfile) {
    const db = getSupabase();
    const { data, error } = await db
        .from("profiles")
        .upsert(profile, { onConflict: "email" })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function getProfile(email: string) {
    const db = getSupabase();
    const { data, error } = await db
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();
    if (error && error.code !== "PGRST116") throw new Error(error.message);
    return data;
}

// ─── Job Applications ───
export interface JobApplication {
    id?: string;
    user_email: string;
    job_title: string;
    company: string;
    job_url: string;
    status: "applied" | "interview" | "rejected" | "offer" | "pending";
    resume_used?: string;
    applied_at?: string;
    notes?: string;
}

export async function saveApplication(app: JobApplication) {
    const db = getSupabase();
    const { data, error } = await db
        .from("applications")
        .insert(app)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function getApplications(email: string) {
    const db = getSupabase();
    const { data, error } = await db
        .from("applications")
        .select("*")
        .eq("user_email", email)
        .order("applied_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function updateApplicationStatus(id: string, status: string) {
    const db = getSupabase();
    const { data, error } = await db
        .from("applications")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ─── Chat History ───
export async function saveChatMessage(
    userEmail: string,
    role: string,
    content: string,
    sessionId: string,
) {
    const db = getSupabase();
    const { error } = await db.from("chat_history").insert({
        user_email: userEmail,
        role,
        content,
        session_id: sessionId,
    });
    if (error) throw new Error(error.message);
}

export async function getChatHistory(userEmail: string, sessionId: string, limit = 20) {
    const db = getSupabase();
    const { data, error } = await db
        .from("chat_history")
        .select("*")
        .eq("user_email", userEmail)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(limit);
    if (error) throw new Error(error.message);
    return data || [];
}

export async function getChatSessions(userEmail: string) {
    const db = getSupabase();
    // Fetch all user messages to group into sessions (latest first)
    const { data, error } = await db
        .from("chat_history")
        .select("session_id, content, created_at")
        .eq("user_email", userEmail)
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(1000);

    if (error) throw new Error(error.message);

    // Group by unique session ID, using their first message as the title
    const sessions = new Map();
    for (const row of (data || [])) {
        if (!sessions.has(row.session_id)) {
            sessions.set(row.session_id, {
                id: row.session_id,
                title: row.content.substring(0, 30) + (row.content.length > 30 ? "..." : ""),
                updatedAt: row.created_at,
            });
        }
    }

    return Array.from(sessions.values());
}

export async function deleteChatSession(userEmail: string, sessionId: string) {
    const db = getSupabase();
    const { error } = await db
        .from("chat_history")
        .delete()
        .eq("user_email", userEmail)
        .eq("session_id", sessionId);
    if (error) throw new Error(error.message);
}

// ─── Resume History ───
export async function saveResume(email: string, jobTitle: string, resumeText: string) {
    const db = getSupabase();
    const { data, error } = await db
        .from("resumes")
        .insert({ user_email: email, job_title: jobTitle, resume_text: resumeText })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function getResumes(email: string) {
    const db = getSupabase();
    const { data, error } = await db
        .from("resumes")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false })
        .limit(20);
    if (error) throw new Error(error.message);
    return data || [];
}

export async function renameChatSession(userEmail: string, sessionId: string, newTitle: string) {
    const db = getSupabase();
    // Assuming the title is stored in the very first message 'content' of that session. Let's add a robust implementation.
    
    // Grab the first user message for this session
    const { data: firstMsg } = await db
        .from("chat_history")
        .select("id")
        .eq("user_email", userEmail)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
        
    if (firstMsg) {
        // Just update the content of the very first message
        await db
            .from("chat_history")
            .update({ content: newTitle })
            .eq("id", firstMsg.id);
    }
}
