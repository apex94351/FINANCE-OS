"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, FilePlus2, Search } from "lucide-react";

type InvoiceStatus = "draft" | "to_pay" | "paid" | "overdue";
type Invoice = {
  id: string;
  user_id: string;
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
  status: InvoiceStatus;
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type InvoiceForm = {
  invoice_number: string;
  invoice_type: "payable" | "receivable";
  supplier_name: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  subtotal_ht: string;
  vat_amount: string;
  vat_rate: string;
  total_ttc: string;
  currency: string;
  category: string;
  notes: string;
  document_id: string;
};

const emptyForm: InvoiceForm = {
  invoice_number: "",
  invoice_type: "payable",
  supplier_name: "",
  customer_name: "",
  issue_date: "",
  due_date: "",
  subtotal_ht: "",
  vat_amount: "",
  vat_rate: "20",
  total_ttc: "",
  currency: "EUR",
  category: "",
  notes: "",
  document_id: "",
};

const filterOptions = [
  { value: "all", label: "Toutes" },
  { value: "to_pay", label: "À payer" },
  { value: "paid", label: "Payées" },
  { value: "overdue", label: "En retard" },
  { value: "receivable", label: "À recevoir" },
] as const;

const sortOptions = [
  { value: "recent", label: "Plus récentes" },
  { value: "oldest", label: "Plus anciennes" },
  { value: "dueSoon", label: "Échéance proche" },
  { value: "amountAsc", label: "Montant croissant" },
  { value: "amountDesc", label: "Montant décroissant" },
] as const;

function getDisplayStatus(invoice: Pick<Invoice, "status" | "due_date">): InvoiceStatus {
  if (invoice.status === "paid") return "paid";
  if (invoice.status === "draft") return "draft";
  if (invoice.status === "overdue") return "overdue";
  if (invoice.due_date && new Date(`${invoice.due_date}T00:00:00`) < new Date()) return "overdue";
  return "to_pay";
}

function labelForStatus(status: InvoiceStatus): string {
  return {
    draft: "Brouillon",
    to_pay: "À payer",
    paid: "Payée",
    overdue: "En retard",
  }[status];
}

function formatAmount(value: number | null | undefined, currency = "EUR") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; file_name?: string | null }>>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filterOptions)[number]["value"]>("all");
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("recent");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    setIsLoading(true);
    try {
      const [invoiceResponse, documentResponse] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/documents"),
      ]);

      const invoiceResult = await invoiceResponse.json().catch(() => null);
      const documentResult = await documentResponse.json().catch(() => null);

      if (!invoiceResponse.ok) {
        throw new Error("Impossible de charger les factures.");
      }

      setInvoices((invoiceResult?.invoices ?? []) as Invoice[]);
      setDocuments((documentResult?.documents ?? []) as Array<{ id: string; name: string; file_name?: string | null }>);
      setMessage(null);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Impossible de charger les factures." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function updateForm(next: Partial<InvoiceForm>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function computeTotals(next: Partial<InvoiceForm>) {
    const state = { ...form, ...next };
    const subtotal = Number(state.subtotal_ht || 0);
    const vat = Number(state.vat_amount || 0);
    const vatRate = Number(state.vat_rate || 0);

    if (state.subtotal_ht && (!state.vat_amount || Number(state.vat_amount) === 0) && vatRate > 0) {
      const autoVat = (subtotal * vatRate) / 100;
      return { ...state, vat_amount: autoVat.toFixed(2), total_ttc: (subtotal + autoVat).toFixed(2) };
    }

    if (state.subtotal_ht && state.vat_amount) {
      return { ...state, total_ttc: (subtotal + vat).toFixed(2) };
    }

    return state;
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!form.invoice_number.trim()) {
      setMessage({ type: "error", text: "Le numéro de facture est obligatoire." });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        invoice_number: form.invoice_number.trim(),
        invoice_type: form.invoice_type,
        supplier_name: form.supplier_name.trim() || null,
        customer_name: form.customer_name.trim() || null,
        issue_date: form.issue_date || null,
        due_date: form.due_date || null,
        subtotal_ht: Number(form.subtotal_ht || 0),
        vat_amount: Number(form.vat_amount || 0),
        vat_rate: Number(form.vat_rate || 0),
        total_ttc: Number(form.total_ttc || form.subtotal_ht || 0),
        currency: form.currency || "EUR",
        category: form.category.trim() || null,
        notes: form.notes.trim() || null,
        document_id: form.document_id || null,
        status: "to_pay",
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error === "invalid_invoice" ? "Les données de la facture sont invalides." : "Impossible de créer cette facture. Veuillez réessayer.");
      }

      setForm(emptyForm);
      setShowForm(false);
      setMessage({ type: "success", text: "Facture créée." });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Impossible de créer cette facture." });
    } finally {
      setIsSaving(false);
    }
  }

  async function markPaid(id: string) {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ? "Impossible de modifier le statut." : "Impossible de modifier le statut.");
      }

      setMessage({ type: "success", text: "Facture marquée comme payée." });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Impossible de modifier le statut." });
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer cette facture ?\n\nCette action est irréversible.")) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Impossible de supprimer cette facture.");
      }
      setMessage({ type: "success", text: "Facture supprimée." });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Impossible de supprimer cette facture." });
    }
  }

  const summary = useMemo(() => {
    const payable = invoices
      .filter((invoice) => invoice.invoice_type === "payable" && getDisplayStatus(invoice) !== "paid")
      .reduce((sum, invoice) => sum + Number(invoice.total_ttc ?? 0), 0);
    const receivable = invoices
      .filter((invoice) => invoice.invoice_type === "receivable" && getDisplayStatus(invoice) !== "paid")
      .reduce((sum, invoice) => sum + Number(invoice.total_ttc ?? 0), 0);
    const overdue = invoices
      .filter((invoice) => getDisplayStatus(invoice) === "overdue")
      .reduce((sum, invoice) => sum + Number(invoice.total_ttc ?? 0), 0);

    return { payable, receivable, overdue, total: invoices.length };
  }, [invoices]);

  const visible = useMemo(() => {
    const searchValue = search.toLowerCase();
    const filtered = invoices.filter((invoice) => {
      const label = `${invoice.invoice_number} ${invoice.supplier_name ?? ""} ${invoice.customer_name ?? ""}`.toLowerCase();
      const matchesSearch = !searchValue || label.includes(searchValue);
      const display = getDisplayStatus(invoice);
      const matchesFilter =
        filter === "all" ||
        (filter === "to_pay" && display === "to_pay") ||
        (filter === "paid" && display === "paid") ||
        (filter === "overdue" && display === "overdue") ||
        (filter === "receivable" && invoice.invoice_type === "receivable");
      return matchesSearch && matchesFilter;
    });

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (a.issue_date ?? a.created_at).localeCompare(b.issue_date ?? b.created_at);
        case "dueSoon":
          return (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31");
        case "amountAsc":
          return Number(a.total_ttc ?? 0) - Number(b.total_ttc ?? 0);
        case "amountDesc":
          return Number(b.total_ttc ?? 0) - Number(a.total_ttc ?? 0);
        case "recent":
        default:
          return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      }
    });
  }, [filter, invoices, search, sort]);

  return (
    <main className="invoices-page">
      <div className="invoices-inner">
        <div className="invoices-top">
          <Link className="brand" href="/dashboard"><span className="brand-mark">A</span><span>AI Finance <em>OS</em></span></Link>
          <Link className="text-link" href="/dashboard"><ArrowLeft size={14} /> Retour au dashboard</Link>
        </div>

        <div className="invoices-heading">
          <div>
            <p className="eyebrow">FINANCE</p>
            <h1>Factures</h1>
            <p>Gérez vos factures fournisseurs et clients.</p>
          </div>
          <button className="button button-dark" type="button" onClick={() => setShowForm((current) => !current)}>
            <FilePlus2 size={16} /> + Nouvelle facture
          </button>
        </div>

        <div className="invoice-summary-grid">
          <article className="summary-card"><span>À payer</span><strong>{formatAmount(summary.payable)}</strong></article>
          <article className="summary-card"><span>À recevoir</span><strong>{formatAmount(summary.receivable)}</strong></article>
          <article className="summary-card"><span>En retard</span><strong>{formatAmount(summary.overdue)}</strong></article>
          <article className="summary-card"><span>Total factures</span><strong>{summary.total}</strong></article>
        </div>

        {message && <p className={`invoice-message ${message.type}`} role="status">{message.text}</p>}

        {showForm && (
          <form className="invoice-form" onSubmit={create}>
            <div className="panel-header"><h2>Créer une facture</h2></div>
            <div className="form-grid wide">
              <label>Numéro de facture<input value={form.invoice_number} onChange={(event) => updateForm({ invoice_number: event.target.value })} required /></label>
              <label>Type<select value={form.invoice_type} onChange={(event) => updateForm({ invoice_type: event.target.value as "payable" | "receivable" })}><option value="payable">À payer</option><option value="receivable">À recevoir</option></select></label>
              <label>Fournisseur<input value={form.supplier_name} onChange={(event) => updateForm({ supplier_name: event.target.value })} /></label>
              <label>Client<input value={form.customer_name} onChange={(event) => updateForm({ customer_name: event.target.value })} /></label>
              <label>Catégorie<input value={form.category} onChange={(event) => updateForm({ category: event.target.value })} /></label>
              <label>Devise<select value={form.currency} onChange={(event) => updateForm({ currency: event.target.value })}><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="CHF">CHF</option></select></label>
              <label>Date d’émission<input type="date" value={form.issue_date} onChange={(event) => updateForm({ issue_date: event.target.value })} required /></label>
              <label>Date d’échéance<input type="date" value={form.due_date} onChange={(event) => updateForm({ due_date: event.target.value })} /></label>
              <label>Montant HT<input type="number" min="0" step="0.01" value={form.subtotal_ht} onChange={(event) => updateForm(computeTotals({ subtotal_ht: event.target.value }))} /></label>
              <label>TVA<input type="number" min="0" step="0.01" value={form.vat_amount} onChange={(event) => updateForm(computeTotals({ vat_amount: event.target.value }))} /></label>
              <label>Taux de TVA<input type="number" min="0" step="0.01" value={form.vat_rate} onChange={(event) => updateForm(computeTotals({ vat_rate: event.target.value }))} /></label>
              <label>Montant TTC<input type="number" min="0" step="0.01" value={form.total_ttc} onChange={(event) => updateForm({ total_ttc: event.target.value })} /></label>
              <label>Document associé<select value={form.document_id} onChange={(event) => updateForm({ document_id: event.target.value })}><option value="">Aucun document</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.name || document.file_name || "Document"}</option>)}</select></label>
              <label className="field-full">Notes<textarea value={form.notes} onChange={(event) => updateForm({ notes: event.target.value })} rows={4} /></label>
            </div>
            <div className="form-actions">
              <button type="button" className="button button-light" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="button button-dark" type="submit" disabled={isSaving}>{isSaving ? "Création..." : "Créer la facture"}</button>
            </div>
          </form>
        )}

        <div className="invoice-toolbar">
          <label className="invoice-search"><Search size={16} /><input placeholder="Rechercher une facture..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <select className="invoice-filter" value={filter} onChange={(event) => setFilter(event.target.value as (typeof filterOptions)[number]["value"])}>
            {filterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className="invoice-filter" value={sort} onChange={(event) => setSort(event.target.value as (typeof sortOptions)[number]["value"])}>
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="invoice-empty"><h2>Chargement des factures...</h2></div>
        ) : visible.length === 0 ? (
          <div className="invoice-empty">
            <h2>Aucune facture pour le moment.</h2>
            <p>Créez votre première facture pour commencer à suivre vos paiements et échéances.</p>
            <button className="button button-dark" type="button" onClick={() => setShowForm(true)}><FilePlus2 size={16} />+ Nouvelle facture</button>
          </div>
        ) : (
          <div className="invoice-table-wrap">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Facture</th>
                  <th>Type</th>
                  <th>Fournisseur / Client</th>
                  <th>Date</th>
                  <th>Échéance</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((invoice) => {
                  const status = getDisplayStatus(invoice);
                  const counterparty = invoice.invoice_type === "payable" ? invoice.supplier_name : invoice.customer_name;
                  return (
                    <tr key={invoice.id}>
                      <td>
                        <strong>{invoice.invoice_number}</strong>
                        <small>{invoice.category || "Sans catégorie"}</small>
                      </td>
                      <td>{invoice.invoice_type === "payable" ? "À payer" : "À recevoir"}</td>
                      <td>{counterparty || "—"}</td>
                      <td>{formatDate(invoice.issue_date)}</td>
                      <td>{formatDate(invoice.due_date)}</td>
                      <td>{formatAmount(invoice.total_ttc ?? invoice.subtotal_ht, invoice.currency || "EUR")}</td>
                      <td><span className={`invoice-status ${status}`}>{labelForStatus(status)}</span></td>
                      <td>
                        <div className="invoice-actions">
                          <Link className="text-link" href={`/invoices/${invoice.id}`}>Détail</Link>
                          <button type="button" className="text-button" onClick={() => void markPaid(invoice.id)}>Payée</button>
                          <button type="button" className="text-button danger" onClick={() => void remove(invoice.id)}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
