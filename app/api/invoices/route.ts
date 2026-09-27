import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const invoiceInput = z.object({
  invoice_number: z.string().trim().min(1).max(120),
  invoice_type: z.enum(["payable", "receivable"]),
  supplier_name: z.string().trim().max(200).nullable().optional(),
  customer_name: z.string().trim().max(200).nullable().optional(),
  issue_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  subtotal_ht: z.number().nonnegative().nullable().optional(),
  vat_amount: z.number().nonnegative().nullable().optional(),
  vat_rate: z.number().nonnegative().nullable().optional(),
  total_ttc: z.number().nonnegative().nullable().optional(),
  currency: z.string().trim().length(3).default("EUR"),
  status: z.enum(["draft", "to_pay", "paid", "overdue"]).optional(),
  category: z.string().trim().max(100).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  document_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
}).strict();

async function getUserContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, companyId: null };
  const { data: membership } = await supabase.from("company_members").select("company_id").eq("user_id", user.id).limit(1).maybeSingle();
  return { supabase, user, companyId: membership?.company_id ?? null };
}

export async function GET() {
  const { supabase, user } = await getUserContext();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Invoices lookup failed", error.message);
    return NextResponse.json({ error: "invoices_unavailable" }, { status: 502 });
  }

  return NextResponse.json({ invoices: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user, companyId } = await getUserContext();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const parsed = invoiceInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_invoice" }, { status: 400 });

  const input = parsed.data;
  const subtotal = Number(input.subtotal_ht ?? 0);
  const vatAmount = Number(input.vat_amount ?? 0);
  const vatRate = Number(input.vat_rate ?? 0);
  const totalTtc = input.total_ttc == null ? subtotal + vatAmount : Number(input.total_ttc);
  const status = input.status ?? "to_pay";
  const invoiceNumber = input.invoice_number.trim();
  const payload = {
    user_id: user.id,
    company_id: input.company_id ?? companyId ?? null,
    document_id: input.document_id ?? null,
    invoice_number: invoiceNumber,
    invoice_type: input.invoice_type,
    supplier_name: input.supplier_name?.trim() || null,
    customer_name: input.customer_name?.trim() || null,
    issue_date: input.issue_date || null,
    due_date: input.due_date || null,
    subtotal_ht: subtotal,
    vat_amount: vatAmount,
    vat_rate: vatRate,
    total_ttc: Number.isFinite(totalTtc) ? totalTtc : subtotal + vatAmount,
    currency: (input.currency || "EUR").toUpperCase(),
    status,
    category: input.category?.trim() || null,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase.from("invoices").insert(payload).select().single();
  if (error || !data) {
    console.error("Invoice creation failed", error?.message ?? "unknown");
    return NextResponse.json({ error: "invoice_create_failed" }, { status: 502 });
  }

  return NextResponse.json({ invoice: data }, { status: 201 });
}