export type InvoiceStatus = "draft" | "to_pay" | "paid" | "overdue";
export type InvoiceType = "payable" | "receivable";

export type Invoice = {
  id: string;
  user_id: string;
  company_id: string | null;
  document_id: string | null;
  invoice_number: string;
  invoice_type: InvoiceType;
  supplier_name: string | null;
  customer_name: string | null;
  issue_date: string | null;
  due_date: string | null;
  subtotal_ht: number;
  vat_amount: number;
  vat_rate: number;
  total_ttc: number;
  currency: string;
  status: InvoiceStatus;
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceFilter = "all" | "to_pay" | "paid" | "overdue" | "receivable";

export type InvoiceSummary = {
  payable: number;
  receivable: number;
  overdue: number;
  total: number;
};

export function getInvoiceDisplayStatus(invoice: Pick<Invoice, "status" | "due_date">): InvoiceStatus {
  if (invoice.status === "paid") return "paid";
  if (invoice.status === "draft") return "draft";
  if (invoice.status === "overdue") return "overdue";
  if (invoice.due_date && new Date(`${invoice.due_date}T00:00:00`) < new Date()) return "overdue";
  return "to_pay";
}

export function getInvoiceSummary(invoices: Array<Pick<Invoice, "invoice_type" | "status" | "total_ttc" | "due_date">>): InvoiceSummary {
  const summary: InvoiceSummary = { payable: 0, receivable: 0, overdue: 0, total: invoices.length };

  for (const invoice of invoices) {
    const displayStatus = getInvoiceDisplayStatus(invoice);
    const amount = Number(invoice.total_ttc ?? 0);

    if (invoice.invoice_type === "payable" && invoice.status !== "paid") {
      summary.payable += amount;
    }

    if (invoice.invoice_type === "receivable" && invoice.status !== "paid") {
      summary.receivable += amount;
    }

    if (displayStatus === "overdue") {
      summary.overdue += amount;
    }
  }

  return summary;
}
