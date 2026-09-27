import { NextResponse } from "next/server";
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const invoiceUpdate = z.object({
  invoice_number: z.string().trim().min(1).max(120).optional(),
  invoice_type: z.enum(["payable", "receivable"]).optional(),
  supplier_name: z.string().trim().max(200).nullable().optional(),
  customer_name: z.string().trim().max(200).nullable().optional(),
  issue_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  subtotal_ht: z.number().nonnegative().nullable().optional(),
  vat_amount: z.number().nonnegative().nullable().optional(),
  vat_rate: z.number().nonnegative().nullable().optional(),
  total_ttc: z.number().nonnegative().nullable().optional(),
  currency: z.string().trim().length(3).optional(),
  status: z.enum(["draft", "to_pay", "paid", "overdue"]).optional(),
  category: z.string().trim().max(100).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  document_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
}).strict();

async function getInvoiceOwnedByUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, invoiceId: string) {
  return supabase.from("invoices").select("*").eq("id", invoiceId).eq("user_id", userId).maybeSingle();
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await getInvoiceOwnedByUser(supabase, user.id, id);
  if (error || !data) return NextResponse.json({ error: "invoice_not_found" }, { status: 404 });

  return NextResponse.json({ invoice: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const parsed = invoiceUpdate.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_invoice" }, { status: 400 });

  const { id } = await params;
  const existing = await getInvoiceOwnedByUser(supabase, user.id, id);
  if (existing.error || !existing.data) return NextResponse.json({ error: "invoice_not_found" }, { status: 404 });

  const update = { ...parsed.data } as Database["public"]["Tables"]["invoices"]["Update"];

  if (typeof update.invoice_number === "string") update.invoice_number = update.invoice_number.trim();
  if (typeof update.supplier_name === "string") update.supplier_name = update.supplier_name.trim() || null;
  if (typeof update.customer_name === "string") update.customer_name = update.customer_name.trim() || null;
  if (typeof update.issue_date === "string") update.issue_date = update.issue_date || null;
  if (typeof update.due_date === "string") update.due_date = update.due_date || null;
  if (typeof update.category === "string") update.category = update.category.trim() || null;
  if (typeof update.notes === "string") update.notes = update.notes.trim() || null;
  if (typeof update.company_id === "string") update.company_id = update.company_id || null;
  if (typeof update.document_id === "string") update.document_id = update.document_id || null;
  if (typeof update.currency === "string") update.currency = update.currency.toUpperCase();
  if (update.subtotal_ht !== undefined) update.subtotal_ht = Number(update.subtotal_ht ?? 0);
  if (update.vat_amount !== undefined) update.vat_amount = Number(update.vat_amount ?? 0);
  if (update.vat_rate !== undefined) update.vat_rate = Number(update.vat_rate ?? 0);
  if (update.total_ttc !== undefined) update.total_ttc = Number(update.total_ttc ?? 0);

  const { data, error } = await supabase
    .from("invoices")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    console.error("Invoice update failed", error?.message ?? "unknown");
    return NextResponse.json({ error: "invoice_update_failed" }, { status: 502 });
  }

  return NextResponse.json({ invoice: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { id } = await params;
  const { error } = await supabase.from("invoices").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    console.error("Invoice delete failed", error.message);
    return NextResponse.json({ error: "invoice_delete_failed" }, { status: 502 });
  }

  return new NextResponse(null, { status: 204 });
}