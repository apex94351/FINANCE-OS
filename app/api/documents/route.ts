import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let query = supabase
    .from("documents")
    .select("id, user_id, company_id, uploaded_by, storage_path, name, mime_type, size_bytes, file_name, file_type, file_size, document_type, status, created_at, updated_at, deleted_at")
    .is("deleted_at", null)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (membership?.company_id) {
    query = supabase
      .from("documents")
      .select("id, user_id, company_id, uploaded_by, storage_path, name, mime_type, size_bytes, file_name, file_type, file_size, document_type, status, created_at, updated_at, deleted_at")
      .is("deleted_at", null)
      .or(`user_id.eq.${user.id},company_id.eq.${membership.company_id}`)
      .order("created_at", { ascending: false });
  }

  const { data: documents, error } = await query;

  if (error) {
    console.error("Documents lookup failed", error.message);
    return NextResponse.json({ error: "documents_unavailable" }, { status: 502 });
  }

  return NextResponse.json({ documents: documents ?? [] });
}