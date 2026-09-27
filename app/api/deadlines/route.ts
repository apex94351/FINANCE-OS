import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { data: member } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const companyId = member?.company_id ?? null;

  if (!companyId) {
    return NextResponse.json({ deadlines: [] });
  }

  const [{ data: invoices, error: invoiceError }, { data: manual, error: manualError }] = await Promise.all([
    supabase.from("invoices").select("id, invoice_number, supplier_name, customer_name, due_date, total_ttc, status, invoice_type").eq("company_id", companyId).not("due_date", "is", null).neq("status", "paid"),
    supabase.from("deadlines").select("id, title, due_date, amount, status, deadline_type, source, completed").eq("company_id", companyId).order("due_date", { ascending: true }),
  ]);

  if (invoiceError || manualError) return NextResponse.json({ error: "deadlines_unavailable" }, { status: 502 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const invoiceDeadlines = (invoices || []).map((invoice) => {
    const dueDate = String(invoice.due_date ?? "");
    const date = new Date(`${dueDate}T00:00:00`);
    const status = dueDate && (date < today || invoice.status === "overdue") ? "overdue" : dueDate && date.getTime() === today.getTime() ? "today" : "upcoming";
    return {
      id: invoice.id,
      title: `${invoice.invoice_type === "payable" ? "Paiement" : "Encaissement"} · ${invoice.supplier_name ?? invoice.customer_name ?? "Tiers"}`,
      due_date: dueDate,
      amount: invoice.total_ttc ?? 0,
      status,
      deadline_type: "invoice",
      source: invoice.invoice_number,
    };
  });

  return NextResponse.json({ deadlines: [...invoiceDeadlines, ...(manual || [])].sort((a, b) => String(a.due_date).localeCompare(String(b.due_date))) });
}