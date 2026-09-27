"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Receipt } from "lucide-react";

type Invoice = { id: string; invoice_number: string; invoice_type: "payable" | "receivable"; counterparty_name: string; due_date: string | null; currency: string; total_amount: number | null; amount: number; status: string };

export function InvoiceBucketPage({ type, title, description }: { type: "payable" | "receivable"; title: string; description: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]); const [isLoading, setIsLoading] = useState(true); const [error, setError] = useState(false);
  useEffect(() => { fetch("/api/invoices").then((response) => response.json()).then((result) => setInvoices(result.invoices || [])).catch(() => setError(true)).finally(() => setIsLoading(false)); }, []);
  const filtered = useMemo(() => invoices.filter((invoice) => invoice.invoice_type === type), [invoices, type]);
  const total = filtered.filter((invoice) => invoice.status !== "paid" && invoice.status !== "cancelled").reduce((sum, invoice) => sum + Number(invoice.total_amount ?? invoice.amount), 0);
  const overdue = filtered.filter((invoice) => invoice.status === "overdue").reduce((sum, invoice) => sum + Number(invoice.total_amount ?? invoice.amount), 0);
  return <main className="bucket-page"><div className="bucket-inner"><div className="bucket-top"><Link className="brand" href="/dashboard"><span className="brand-mark">A</span><span>AI Finance <em>OS</em></span></Link><Link className="text-link" href="/dashboard"><ArrowLeft size={14} /> Retour au dashboard</Link></div><div className="bucket-heading"><p className="eyebrow">FINANCE</p><h1>{title}</h1><p>{description}</p></div>{error && <p className="invoice-message error">Impossible de charger les factures.</p>}<div className="bucket-kpis"><div><small>Total</small><strong>{total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</strong></div><div><small>En retard</small><strong>{overdue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</strong></div><div><small>Factures</small><strong>{filtered.length}</strong></div></div>{isLoading ? <p className="invoice-empty">Chargement...</p> : filtered.length === 0 ? <section className="invoice-empty"><Receipt size={24} /><h2>Aucune facture</h2><p>Les montants apparaîtront après la création d’une facture réelle.</p></section> : <div className="bucket-list">{filtered.map((invoice) => <Link className="bucket-row" href={`/invoices/${invoice.id}`} key={invoice.id}><span><strong>{invoice.counterparty_name}</strong><small>{invoice.invoice_number}</small></span><span>{invoice.due_date ? new Date(`${invoice.due_date}T00:00:00`).toLocaleDateString("fr-FR") : "Sans échéance"}</span><strong>{Number(invoice.total_amount ?? invoice.amount).toLocaleString("fr-FR", { style: "currency", currency: invoice.currency })}</strong><span className={`invoice-status ${invoice.status}`}>{invoice.status}</span></Link>)}</div>}</div></main>;
}
