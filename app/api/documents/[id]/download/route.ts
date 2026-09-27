import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  const { id } = await params;
  const { data: document, error } = await supabase.from("documents").select("storage_path").eq("id", id).is("deleted_at", null).maybeSingle();
  if (error || !document) return NextResponse.json({ error: "document_not_found" }, { status: 404 });
  const { data: signed, error: signedError } = await supabase.storage.from("documents").createSignedUrl(document.storage_path, 60);
  if (signedError || !signed) return NextResponse.json({ error: "download_unavailable" }, { status: 502 });
  return NextResponse.json({ url: signed.signedUrl });
}