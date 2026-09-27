import type { Database } from "../supabase/database.types";
import { getInvoiceSummary } from "./types";
import type { Invoice, InvoiceSummary } from "./types";
export { getInvoiceDisplayStatus, getInvoiceSummary } from "./types";

export type InvoiceInput = {
  invoice_number: string;
  invoice_type: "payable" | "receivable";
  supplier_name?: string | null;
  customer_name?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  subtotal_ht?: number | null;
  vat_amount?: number | null;
  vat_rate?: number | null;
  total_ttc?: number | null;
  currency?: string;
  status?: "draft" | "to_pay" | "paid" | "overdue";
  category?: string | null;
  notes?: string | null;
  document_id?: string | null;
  company_id?: string | null;
};

async function getUserContext() {
  const { createClient } = await import("../supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, companyId: null };
  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  return { supabase, user, companyId: membership?.company_id ?? null };
}

export async function getInvoices(): Promise<Invoice[]> {
  const { supabase, user } = await getUserContext();
  if (!user) throw new Error("not_authenticated");

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("invoices_unavailable");
  return (data ?? []) as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice> {
  const { supabase, user } = await getUserContext();
  if (!user) throw new Error("not_authenticated");

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) throw new Error("invoice_not_found");
  return data as Invoice;
}

export async function createInvoice(input: InvoiceInput): Promise<Invoice> {
  const { supabase, user, companyId } = await getUserContext();
  if (!user) throw new Error("not_authenticated");

  const payload = {
    user_id: user.id,
    company_id: input.company_id ?? companyId ?? null,
    document_id: input.document_id ?? null,
    invoice_number: input.invoice_number.trim(),
    invoice_type: input.invoice_type,
    supplier_name: input.supplier_name?.trim() || null,
    customer_name: input.customer_name?.trim() || null,
    issue_date: input.issue_date || null,
    due_date: input.due_date || null,
    subtotal_ht: Number(input.subtotal_ht ?? 0),
    vat_amount: Number(input.vat_amount ?? 0),
    vat_rate: Number(input.vat_rate ?? 0),
    total_ttc: Number(input.total_ttc ?? input.subtotal_ht ?? 0),
    currency: (input.currency ?? "EUR").toUpperCase(),
    status: input.status ?? "to_pay",
    category: input.category?.trim() || null,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase.from("invoices").insert(payload).select().single();
  if (error || !data) throw new Error("invoice_create_failed");
  return data as Invoice;
}

export async function updateInvoice(id: string, input: Partial<InvoiceInput>): Promise<Invoice> {
  const { supabase, user } = await getUserContext();
  if (!user) throw new Error("not_authenticated");

  const existing = await getInvoice(id);
  const payload = { ...input } as Database["public"]["Tables"]["invoices"]["Update"];

  if (payload.invoice_number !== undefined) payload.invoice_number = String(payload.invoice_number).trim();
  if (payload.supplier_name !== undefined) payload.supplier_name = payload.supplier_name?.trim() || null;
  if (payload.customer_name !== undefined) payload.customer_name = payload.customer_name?.trim() || null;
  if (payload.issue_date !== undefined) payload.issue_date = payload.issue_date || null;
  if (payload.due_date !== undefined) payload.due_date = payload.due_date || null;
  if (payload.category !== undefined) payload.category = payload.category?.trim() || null;
  if (payload.notes !== undefined) payload.notes = payload.notes?.trim() || null;
  if (payload.company_id !== undefined) payload.company_id = payload.company_id || null;
  if (payload.document_id !== undefined) payload.document_id = payload.document_id || null;
  if (payload.currency !== undefined) payload.currency = String(payload.currency).toUpperCase();
  if (payload.subtotal_ht !== undefined) payload.subtotal_ht = Number(payload.subtotal_ht ?? existing.subtotal_ht ?? 0);
  if (payload.vat_amount !== undefined) payload.vat_amount = Number(payload.vat_amount ?? existing.vat_amount ?? 0);
  if (payload.vat_rate !== undefined) payload.vat_rate = Number(payload.vat_rate ?? existing.vat_rate ?? 0);
  if (payload.total_ttc !== undefined) payload.total_ttc = Number(payload.total_ttc ?? existing.total_ttc ?? 0);

  const { data, error } = await supabase.from("invoices").update(payload).eq("id", id).eq("user_id", user.id).select().single();
  if (error || !data) throw new Error("invoice_update_failed");
  return data as Invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { supabase, user } = await getUserContext();
  if (!user) throw new Error("not_authenticated");

  const { error } = await supabase.from("invoices").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error("invoice_delete_failed");
}

export async function markInvoiceAsPaid(id: string): Promise<Invoice> {
  const { supabase, user } = await getUserContext();
  if (!user) throw new Error("not_authenticated");

  const { data, error } = await supabase.from("invoices").update({ status: "paid" }).eq("id", id).eq("user_id", user.id).select().single();
  if (error || !data) throw new Error("invoice_update_failed");
  return data as Invoice;
}

export async function getInvoiceSummaryReport(): Promise<InvoiceSummary> {
  const invoices = await getInvoices();
  return getInvoiceSummary(
    invoices.map((invoice) => ({
      invoice_type: invoice.invoice_type,
      status: invoice.status,
      total_ttc: invoice.total_ttc,
      due_date: invoice.due_date,
    })),
  );
}
