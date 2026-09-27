import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  const { id } = await params;
  const { data: document, error } = await supabase.from("documents").select("id, user_id, company_id, uploaded_by, name, mime_type, size_bytes, file_name, file_type, file_size, document_type, status, created_at, updated_at, storage_path").eq("id", id).is("deleted_at", null).maybeSingle();
  if (error || !document) return NextResponse.json({ error: "document_not_found" }, { status: 404 });
  const { data: signed, error: signedError } = await supabase.storage.from("documents").createSignedUrl(document.storage_path, 300);
  if (signedError || !signed) return NextResponse.json({ error: "preview_unavailable" }, { status: 502 });
  return NextResponse.json({ document, url: signed.signedUrl });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  const { id } = await params;
  const { data: document, error } = await supabase.from("documents").select("storage_path").eq("id", id).is("deleted_at", null).maybeSingle();
  if (error || !document) return NextResponse.json({ error: "document_not_found" }, { status: 404 });
  const { error: storageError } = await supabase.storage.from("documents").remove([document.storage_path]);
  if (storageError) return NextResponse.json({ error: "delete_failed" }, { status: 502 });
  const { error: deleteError } = await supabase.from("documents").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: "delete_failed" }, { status: 502 });
  return new NextResponse(null, { status: 204 });
}