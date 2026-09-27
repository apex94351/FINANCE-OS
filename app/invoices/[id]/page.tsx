"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

type InvoiceState = {
  id: string;
  user_id?: string;
  company_id: string | null;
  document_id: string | null;
  invoice_number: string;
  invoice_type: "payable" | "receivable";
  supplier_name: string | null;
  customer_name: string | null;
  issue_date: string | null;
  due_date: string | null;
  subtotal_ht: number | null;
  vat_amount: number | null;
  vat_rate: number | null;
  total_ttc: number | null;
  currency: string;
  status: "draft" | "to_pay" | "paid" | "overdue";
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function getDisplayStatus(invoice: Pick<InvoiceState, "status" | "due_date">) {
  if (invoice.status === "paid") return "Payée";
  if (invoice.status === "overdue") return "En retard";
  if (invoice.due_date && new Date(`${invoice.due_date}T00:00:00`) < new Date()) return "En retard";
  return "À payer";
}

function formatCurrency(value: number | null | undefined, currency = "EUR") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/invoices/${params.id}`);
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.error === "invoice_not_found" ? "Facture introuvable." : "Impossible de charger la facture.");
        }
        setInvoice(result.invoice as InvoiceState);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Impossible de charger la facture.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [params.id]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!invoice) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          invoice_number: invoice.invoice_number,
          invoice_type: invoice.invoice_type,
          supplier_name: invoice.supplier_name,
          customer_name: invoice.customer_name,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          subtotal_ht: Number(invoice.subtotal_ht ?? 0),
          vat_amount: Number(invoice.vat_amount ?? 0),
          vat_rate: Number(invoice.vat_rate ?? 0),
          total_ttc: Number(invoice.total_ttc ?? 0),
          currency: invoice.currency,
          category: invoice.category,
          notes: invoice.notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Impossible d’enregistrer les modifications.");
      }

      setMessage("Modifications enregistrées.");
      const updated = await response.json().catch(() => null);
      setInvoice((updated?.invoice ?? invoice) as InvoiceState);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d’enregistrer les modifications.");
    } finally {
      setIsSaving(false);
    }
  }

  async function markPaid() {
    if (!invoice) return;
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (!response.ok) throw new Error("Impossible de modifier le statut.");
      setInvoice({ ...invoice, status: "paid" });
      setMessage("Facture marquée comme payée.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de modifier le statut.");
    }
  }

  async function remove() {
    if (!invoice) return;
    if (!window.confirm("Supprimer cette facture ?\n\nCette action est irréversible.")) return;

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Impossible de supprimer la facture.");
      router.push("/invoices");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de supprimer la facture.");
    }
  }

  if (isLoading) {
    return (
      <main className="invoice-detail-page">
        <div className="invoice-detail-inner">
          <p>Chargement de la facture...</p>
        </div>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="invoice-detail-page">
        <div className="invoice-detail-inner">
          <Link className="text-link" href="/invoices"><ArrowLeft size={14} /> Retour aux factures</Link>
          <div className="invoice-detail-empty">
            <h1>{message || "Facture introuvable"}</h1>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="invoice-detail-page">
      <div className="invoice-detail-inner">
        <div className="invoice-detail-top">
          <Link className="brand" href="/dashboard"><span className="brand-mark">A</span><span>AI Finance <em>OS</em></span></Link>
          <Link className="text-link" href="/invoices"><ArrowLeft size={14} /> Retour aux factures</Link>
        </div>

        <div className="invoice-detail-heading">
          <div>
            <p className="eyebrow">FACTURE {invoice.invoice_number}</p>
            <h1>{invoice.invoice_number}</h1>
            <p>{getDisplayStatus(invoice)}</p>
          </div>
          <div className="invoice-detail-actions">
            <button type="button" className="button button-light" onClick={() => void markPaid()}>
              Marquer comme payée
            </button>
            <button type="button" className="button button-dark" onClick={() => void remove()}>
              <Trash2 size={15} /> Supprimer
            </button>
          </div>
        </div>

        {message && <p className="invoice-message success" role="status">{message}</p>}

        <div className="invoice-detail-grid">
          <section className="invoice-preview">
            <div className="invoice-meta-panel">
              <p className="eyebrow">MONTANT TOTAL</p>
              <h2>{formatCurrency(invoice.total_ttc ?? invoice.subtotal_ht, invoice.currency || "EUR")}</h2>
              <dl>
                <div><dt>Fournisseur</dt><dd>{invoice.supplier_name || "—"}</dd></div>
                <div><dt>Client</dt><dd>{invoice.customer_name || "—"}</dd></div>
                <div><dt>Date d’émission</dt><dd>{formatDate(invoice.issue_date)}</dd></div>
                <div><dt>Échéance</dt><dd>{formatDate(invoice.due_date)}</dd></div>
                <div><dt>Statut</dt><dd>{getDisplayStatus(invoice)}</dd></div>
              </dl>
            </div>
          </section>

          <form className="invoice-edit-form" onSubmit={save}>
            <div className="panel-title"><h2>Informations</h2><p>Les changements sont enregistrés dans Supabase.</p></div>

            <label>Numéro de facture<input value={invoice.invoice_number} onChange={(event) => setInvoice({ ...invoice, invoice_number: event.target.value })} required /></label>
            <label>Type<select value={invoice.invoice_type} onChange={(event) => setInvoice({ ...invoice, invoice_type: event.target.value as "payable" | "receivable" })}><option value="payable">À payer</option><option value="receivable">À recevoir</option></select></label>
            <label>Fournisseur<input value={invoice.supplier_name ?? ""} onChange={(event) => setInvoice({ ...invoice, supplier_name: event.target.value })} /></label>
            <label>Client<input value={invoice.customer_name ?? ""} onChange={(event) => setInvoice({ ...invoice, customer_name: event.target.value })} /></label>
            <div className="form-grid">
              <label>Date d’émission<input type="date" value={invoice.issue_date ?? ""} onChange={(event) => setInvoice({ ...invoice, issue_date: event.target.value || null })} /></label>
              <label>Échéance<input type="date" value={invoice.due_date ?? ""} onChange={(event) => setInvoice({ ...invoice, due_date: event.target.value || null })} /></label>
            </div>
            <div className="form-grid">
              <label>Montant HT<input type="number" min="0" step="0.01" value={invoice.subtotal_ht ?? ""} onChange={(event) => setInvoice({ ...invoice, subtotal_ht: Number(event.target.value) || 0 })} /></label>
              <label>TVA<input type="number" min="0" step="0.01" value={invoice.vat_amount ?? ""} onChange={(event) => setInvoice({ ...invoice, vat_amount: Number(event.target.value) || 0 })} /></label>
              <label>Taux de TVA<input type="number" min="0" step="0.01" value={invoice.vat_rate ?? ""} onChange={(event) => setInvoice({ ...invoice, vat_rate: Number(event.target.value) || 0 })} /></label>
              <label>Montant TTC<input type="number" min="0" step="0.01" value={invoice.total_ttc ?? ""} onChange={(event) => setInvoice({ ...invoice, total_ttc: Number(event.target.value) || 0 })} /></label>
            </div>
            <label>Devise<select value={invoice.currency} onChange={(event) => setInvoice({ ...invoice, currency: event.target.value })}><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="CHF">CHF</option></select></label>
            <label>Notes<textarea value={invoice.notes ?? ""} onChange={(event) => setInvoice({ ...invoice, notes: event.target.value })} rows={4} /></label>
            <button className="button button-dark" type="submit" disabled={isSaving}><Save size={15} />{isSaving ? "Enregistrement..." : "Enregistrer"}</button>
          </form>
        </div>
      </div>
    </main>
  );
}
