import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

function matchesSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  return false;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const formData = await request.formData();
  const entry = formData.get("file");
  if (!(entry instanceof File)) return NextResponse.json({ error: "file_required" }, { status: 400 });
  if (!allowedTypes.has(entry.type)) return NextResponse.json({ error: "unsupported_file_type" }, { status: 415 });
  if (entry.size <= 0 || entry.size > MAX_FILE_SIZE) return NextResponse.json({ error: "invalid_file_size" }, { status: 413 });

  const bytes = new Uint8Array(await entry.arrayBuffer());
  if (!matchesSignature(bytes, entry.type)) return NextResponse.json({ error: "invalid_file_content" }, { status: 415 });

  const { data: membership, error: membershipError } = await supabase.from("company_members").select("company_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (membershipError) {
    console.error("Document membership lookup failed", membershipError.message);
    return NextResponse.json({ error: "document_context_failed" }, { status: 502 });
  }

  const safeName = entry.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "document";
  const documentId = crypto.randomUUID();
  const storagePath = `${user.id}/${documentId}/${safeName}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, bytes, { contentType: entry.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "upload_failed" }, { status: 502 });

  const { data: document, error: insertError } = await supabase.from("documents").insert({ id: documentId, user_id: user.id, company_id: membership?.company_id ?? null, uploaded_by: user.id, storage_path: storagePath, name: entry.name, mime_type: entry.type, size_bytes: entry.size, file_name: entry.name, file_type: entry.type, file_size: entry.size, document_type: "other", status: "uploaded" }).select().single();
  if (insertError) {
    await supabase.storage.from("documents").remove([storagePath]);
    return NextResponse.json({ error: "document_record_failed" }, { status: 502 });
  }

  return NextResponse.json({ document }, { status: 201 });
}