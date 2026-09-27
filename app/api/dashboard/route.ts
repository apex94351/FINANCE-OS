import { NextRequest, NextResponse } from "next/server";
import { getPeriodRange } from "@/lib/dashboard/period";
import { emptyDashboardSummary, type DashboardActivity, type DashboardDeadline, type DashboardResponse, type PeriodPreset } from "@/lib/dashboard/types";
import { createClient } from "@/lib/supabase/server";

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isWithinRange(dateValue: string | null | undefined, start: Date, end: Date): boolean {
  if (!dateValue) return false;
  const candidate = new Date(`${dateValue}T00:00:00`);
  return candidate >= start && candidate <= end;
}

function chartBucket(dateValue: string, range: { from: string; to: string }): string {
  const date = new Date(dateValue.includes("T") ? dateValue : `${dateValue}T00:00:00`);
  const from = new Date(`${range.from}T00:00:00`);
  const to = new Date(`${range.to}T23:59:59`);
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
  if (days <= 1) return `${date.toISOString().slice(0, 10)}T${String(date.getHours()).padStart(2, "0")}:00`;
  if (days <= 45) return date.toISOString().slice(0, 10);
  if (days <= 180) {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 7);
}

function chartLabel(bucket: string): string {
  if (bucket.includes("T")) return bucket.slice(11);
  return bucket;
}

function buildDashboardSummary(
  invoices: Array<Record<string, unknown>>,
  expenses: Array<Record<string, unknown>>,
  deadlines: Array<Record<string, unknown>>,
  range: { from: string; to: string },
  preset: PeriodPreset,
): DashboardResponse {
  const start = new Date(`${range.from}T00:00:00`);
  const end = new Date(`${range.to}T23:59:59`);

  const filteredInvoices = invoices.filter((invoice) => {
    const date = typeof invoice.due_date === "string" ? invoice.due_date : null;
    return isWithinRange(date, start, end) || isWithinRange(typeof invoice.created_at === "string" ? invoice.created_at.slice(0, 10) : null, start, end);
  });

  const filteredExpenses = expenses.filter((expense) => {
    const date = typeof expense.expense_date === "string" ? expense.expense_date : null;
    return isWithinRange(date, start, end) || isWithinRange(typeof expense.created_at === "string" ? expense.created_at.slice(0, 10) : null, start, end);
  });

  const payable = filteredInvoices
    .filter((invoice) => invoice.invoice_type === "payable" && invoice.status !== "paid")
    .reduce((sum, invoice) => sum + toNumber(invoice.total_ttc ?? invoice.subtotal_ht ?? 0), 0);
  const payableCount = filteredInvoices.filter((invoice) => invoice.invoice_type === "payable" && invoice.status !== "paid").length;

  const receivable = filteredInvoices
    .filter((invoice) => invoice.invoice_type === "receivable" && invoice.status !== "paid")
    .reduce((sum, invoice) => sum + toNumber(invoice.total_ttc ?? invoice.subtotal_ht ?? 0), 0);
  const receivableCount = filteredInvoices.filter((invoice) => invoice.invoice_type === "receivable" && invoice.status !== "paid").length;

  const overdue = filteredInvoices
    .filter((invoice) => invoice.status === "overdue" || (typeof invoice.due_date === "string" && new Date(`${invoice.due_date}T00:00:00`) < new Date() && invoice.status !== "paid"))
    .reduce((sum, invoice) => sum + toNumber(invoice.total_ttc ?? invoice.subtotal_ht ?? 0), 0);

  const expenseTotal = filteredExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const chartMap = new Map<string, { date: string; label: string; income: number; expenses: number; net: number }>();

  const ensureBucket = (bucketKey: string) => {
    if (!chartMap.has(bucketKey)) chartMap.set(bucketKey, { date: bucketKey, label: chartLabel(bucketKey), income: 0, expenses: 0, net: 0 });
    return chartMap.get(bucketKey)!;
  };

  for (const invoice of filteredInvoices) {
    const invoiceDate = typeof invoice.created_at === "string" ? invoice.created_at : (typeof invoice.due_date === "string" ? invoice.due_date : range.from);
    const amount = toNumber(invoice.total_ttc ?? invoice.subtotal_ht ?? 0);
    const bucket = ensureBucket(chartBucket(invoiceDate, range));
    if (invoice.invoice_type === "receivable") {
      bucket.income += amount;
    } else {
      bucket.expenses += amount;
    }
    bucket.net = bucket.income - bucket.expenses;
  }

  for (const expense of filteredExpenses) {
    const expenseDate = typeof expense.expense_date === "string" ? expense.expense_date : (typeof expense.created_at === "string" ? expense.created_at : range.from);
    const bucket = ensureBucket(chartBucket(expenseDate, range));
    bucket.expenses += toNumber(expense.amount);
    bucket.net = bucket.income - bucket.expenses;
  }

  const chart = Array.from(chartMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const recentActivity = [...invoices, ...expenses]
    .map((entry): DashboardActivity | null => {
      if ("invoice_number" in entry) {
        const amount = toNumber(entry.total_ttc ?? entry.subtotal_ht ?? 0);
        const direction: DashboardActivity["direction"] = entry.invoice_type === "receivable" ? "in" : "out";
        return {
          id: String(entry.id),
          type: "invoice",
          description: String(entry.invoice_number || "Facture"),
          thirdParty: String(entry.supplier_name || entry.customer_name || "Tiers"),
          category: "Facture",
          date: typeof entry.created_at === "string" ? entry.created_at : range.to,
          amount,
          direction,
        };
      }
      return {
        id: String(entry.id),
        type: "expense",
        description: String(entry.description || "Dépense"),
        thirdParty: String(entry.supplier_name || ""),
        category: String(entry.category || "Dépense"),
        date: typeof entry.created_at === "string" ? entry.created_at : range.to,
        amount: toNumber(entry.amount),
        direction: "out",
      };
    })
    .filter((entry): entry is DashboardActivity => entry !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const upcomingDeadlinesRaw = [...deadlines, ...invoices]
    .map((entry): DashboardDeadline | null => {
      if ("due_date" in entry && entry.due_date) {
        const dueDate = String(entry.due_date);
        const amount = toNumber(entry.total_ttc ?? entry.subtotal_ht ?? 0);
        const status: DashboardDeadline["status"] = new Date(`${dueDate}T00:00:00`) < new Date() ? "overdue" : "upcoming";
        return {
          id: String(entry.id),
          title: `${String(entry.invoice_number || "Facture")}`,
          thirdParty: String(entry.supplier_name || entry.customer_name || "Tiers"),
          description: entry.invoice_type === "receivable" ? "À recevoir" : "À payer",
          dueDate,
          amount,
          status,
        };
      }
      const dueDate = String(entry.due_date ?? "");
      if (!dueDate) return null;
      return {
        id: String(entry.id),
        title: String(entry.title || "Échéance"),
        thirdParty: String(entry.third_party || ""),
        description: String(entry.description || "Échéance"),
        dueDate,
        amount: toNumber(entry.amount),
        status: "upcoming",
      };
    });

  const upcomingDeadlines = upcomingDeadlinesRaw
    .filter((entry): entry is DashboardDeadline => entry !== null)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return {
    currency: "EUR",
    period: { from: range.from, to: range.to, preset },
    kpis: {
      payable,
      payableCount,
      receivable,
      receivableCount,
      expenses: expenseTotal,
      overdue,
      invoiceCount: filteredInvoices.length,
      expenseCount: filteredExpenses.length,
      deadlineCount: upcomingDeadlines.length,
    },
    chart,
    recentActivity,
    upcomingDeadlines,
  } satisfies DashboardResponse;
}

export async function GET(request: NextRequest) {
  const preset = (request.nextUrl.searchParams.get("period") ?? "30d") as PeriodPreset;
  const customFrom = request.nextUrl.searchParams.get("from") ?? "";
  const customTo = request.nextUrl.searchParams.get("to") ?? "";
  const range = getPeriodRange(preset, customFrom, customTo);
  if (!range.from || !range.to || range.from > range.to) {
    return NextResponse.json({ error: "invalid_period" }, { status: 400 });
  }
  const emptySummary = emptyDashboardSummary(preset, range.from, range.to);

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ ...emptySummary, error: "dashboard_unavailable" } satisfies DashboardResponse, { status: 401 });
  }

  const { data: member, error: memberError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (memberError) {
    console.error("Dashboard membership lookup failed", memberError.message);
    return NextResponse.json({ ...emptySummary, error: "dashboard_unavailable" } satisfies DashboardResponse, { status: 502 });
  }

  const companyId = member?.company_id ?? null;

  if (!companyId) {
    const summary = { ...emptySummary, currency: "EUR" } satisfies DashboardResponse;
    return NextResponse.json(summary);
  }

  const companyQuery = supabase.from("companies").select("currency").eq("id", companyId).maybeSingle();
  const { data: company, error: companyError } = await companyQuery;

  if (companyError) {
    console.error("Dashboard company lookup failed", companyError.message);
    return NextResponse.json({ ...emptySummary, error: "dashboard_unavailable" } satisfies DashboardResponse, { status: 502 });
  }

  const invoicesQuery = supabase.from("invoices").select("id, invoice_number, customer_name, supplier_name, invoice_type, total_ttc, currency, due_date, status, created_at").eq("company_id", companyId).order("created_at", { ascending: false });

  const expensesQuery = supabase.from("expenses").select("id, description, amount, expense_date, currency, created_at").eq("company_id", companyId).order("created_at", { ascending: false });

  const deadlinesQuery = supabase.from("deadlines").select("id, title, due_date, amount, status").eq("company_id", companyId).order("due_date", { ascending: true }).limit(10);

  const [invoicesResult, expensesResult, deadlinesResult] = await Promise.all([
    invoicesQuery,
    expensesQuery,
    deadlinesQuery,
  ]);

  const failedQuery = invoicesResult.error || expensesResult.error || deadlinesResult.error;
  if (failedQuery) {
    console.error("Dashboard data lookup failed", failedQuery.message);
    return NextResponse.json({ ...emptySummary, error: "dashboard_unavailable" } satisfies DashboardResponse, { status: 502 });
  }

  const summary = buildDashboardSummary(
    invoicesResult.data ?? [],
    expensesResult.data ?? [],
    deadlinesResult.data ?? [],
    range,
    preset,
  );
  summary.currency = company?.currency || "EUR";

  return NextResponse.json(summary satisfies DashboardResponse);
}