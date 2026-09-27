import { createClient } from "@/lib/supabase/client";

export type Profile = { id: string; first_name: string; last_name: string; avatar_url: string | null };

export async function getCurrentProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, error: new Error("not_authenticated") };
  const { data, error } = await supabase.from("profiles").select("id, first_name, last_name, avatar_url").eq("id", user.id).maybeSingle();
  return { user, profile: data as Profile | null, error };
}