"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, BadgeDollarSign, Bell, CircleAlert, FileText, Landmark, RefreshCw, Wallet } from "lucide-react";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { emptyDashboardSummary, type DashboardSummary, type PeriodPreset } from "@/lib/dashboard/types";

function money(value: number, currency: string): string {
  if (!Number.isFinite(value)) return "0 €";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function dateLabel(value: string, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return "Date non définie";
  const normalized = /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value.slice(0, 10);
  const date = new Date(`${normalized}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", options ?? { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown): number {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeSummary(value: unknown, preset: PeriodPreset): DashboardSummary {
  const fallback = emptyDashboardSummary(preset);
  if (!isRecord(value)) return fallback;

  const kpis = isRecord(value.kpis) ? value.kpis : {};
  const period = isRecord(value.period) ? value.period : {};
  const chart = Array.isArray(value.chart)
    ? value.chart.filter(isRecord).map((point) => ({
        date: typeof point.date === "string" ? point.date : "",
        label: typeof point.label === "string" ? point.label : "",
        income: toNumber(point.income),
        expenses: toNumber(point.expenses),
        net: toNumber(point.net),
      }))
    : [];

  const recentActivity: DashboardSummary["recentActivity"] = Array.isArray(value.recentActivity)
    ? value.recentActivity.filter(isRecord).map((item) => ({
        id: typeof item.id === "string" ? item.id : "activity",
        type: (typeof item.type === "string" && (item.type === "invoice" || item.type === "expense" || item.type === "payment" || item.type === "deadline")) ? item.type : "invoice",
        description: typeof item.description === "string" ? item.description : "Mouvement",
        thirdParty: typeof item.thirdParty === "string" ? item.thirdParty : "",
        category: typeof item.category === "string" ? item.category : "",
        date: typeof item.date === "string" ? item.date : "",
        amount: toNumber(item.amount),
        direction: (typeof item.direction === "string" && (item.direction === "in" || item.direction === "out")) ? item.direction : "in",
      }))
    : [];

  const upcomingDeadlines: DashboardSummary["upcomingDeadlines"] = Array.isArray(value.upcomingDeadlines)
    ? value.upcomingDeadlines.filter(isRecord).map((item) => ({
        id: typeof item.id === "string" ? item.id : "deadline",
        title: typeof item.title === "string" ? item.title : "Échéance",
        thirdParty: typeof item.thirdParty === "string" ? item.thirdParty : "",
        description: typeof item.description === "string" ? item.description : "Échéance",
        dueDate: typeof item.dueDate === "string" ? item.dueDate : "",
        amount: item.amount === null || item.amount === undefined ? null : toNumber(item.amount),
        status: (typeof item.status === "string" && (item.status === "upcoming" || item.status === "today" || item.status === "overdue" || item.status === "completed")) ? item.status : "upcoming",
      }))
    : [];

  return {
    currency: typeof value.currency === "string" ? value.currency : "EUR",
    period: {
      from: typeof period.from === "string" ? period.from : "",
      to: typeof period.to === "string" ? period.to : "",
      preset,
    },
    kpis: {
      payable: toNumber(kpis.payable),
      payableCount: toNumber(kpis.payableCount),
      receivable: toNumber(kpis.receivable),
      receivableCount: toNumber(kpis.receivableCount),
      expenses: toNumber(kpis.expenses),
      overdue: toNumber(kpis.overdue),
      invoiceCount: toNumber(kpis.invoiceCount),
      expenseCount: toNumber(kpis.expenseCount),
      deadlineCount: toNumber(kpis.deadlineCount),
    },
    chart,
    recentActivity,
    upcomingDeadlines,
  };
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [customError, setCustomError] = useState("");
  const [customApplied, setCustomApplied] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period });
      if (period === "custom") {
        if (customFrom) params.set("from", customFrom);
        if (customTo) params.set("to", customTo);
      }
      const response = await fetch(`/api/dashboard?${params.toString()}`);
      const payload: unknown = await response.json();
      if (!response.ok || (isRecord(payload) && (payload.error === "dashboard_unavailable" || payload.error === "invalid_period"))) {
        throw new Error(isRecord(payload) && payload.error === "invalid_period" ? "invalid_period" : "dashboard_unavailable");
      }
      setSummary(normalizeSummary(payload, period));
    } catch (loadError) {
      setError(loadError instanceof Error && loadError.message === "invalid_period" ? "La période sélectionnée est invalide." : "Impossible de charger les données financières.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [customFrom, customTo, period]);

  useEffect(() => {
    if (period === "custom" && !customApplied) return;
    void loadDashboard();
  }, [customApplied, loadDashboard, period]);

  const isEmpty = useMemo(() => {
    if (!summary) return true;
    return summary.kpis.payable === 0 && summary.kpis.receivable === 0 && summary.kpis.expenses === 0 && summary.kpis.overdue === 0 && summary.chart.length === 0 && summary.upcomingDeadlines.length === 0 && summary.recentActivity.length === 0;
  }, [summary]);

  const tasks = useMemo(() => {
    if (!summary) return [];
    const items = [] as Array<{ label: string; value: string }>;
    if (summary.kpis.overdue > 0) items.push({ label: `${money(summary.kpis.overdue, summary.currency)} en retard`, value: "Voir les factures" });
    if (summary.upcomingDeadlines.length > 0) items.push({ label: `${summary.upcomingDeadlines.length} échéance(s) à venir`, value: "Voir les échéances" });
    return items;
  }, [summary]);

  if (loading) {
    return <main className="dashboard-page"><div className="dashboard-surface"><div className="dashboard-loading"><span className="loading-orb" /><div><strong>Préparation de votre espace financier</strong><p>Récupération des données de l’entreprise…</p></div></div><section className="dashboard-kpis dashboard-kpis-loading">{[1, 2, 3, 4].map((item) => <div className="kpi-card" key={item}><span className="skeleton skeleton-short" /><span className="skeleton skeleton-value" /><span className="skeleton skeleton-caption" /></div>)}</section></div></main>;
  }

  if (error) {
    return <main className="dashboard-page"><div className="dashboard-surface"><div className="dashboard-error"><div><strong>Impossible de charger les données financières.</strong><p>{error === "Impossible de charger les données financières." ? "Vérifiez votre connexion puis relancez le chargement." : error}</p></div><button className="button button-light" type="button" onClick={() => void loadDashboard()}><RefreshCw size={15} /> Réessayer</button></div></div></main>;
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-surface">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow"><span className="eyebrow-mark" /> CENTRE DE CONTRÔLE</p>
            <h1>Dashboard</h1>
            <p className="dashboard-subtitle">Vue d’ensemble de votre activité financière</p>
          </div>
          <PeriodSelector
            value={period}
            onChange={setPeriod}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={(value) => { setCustomApplied(false); setCustomFrom(value); }}
            onCustomToChange={(value) => { setCustomApplied(false); setCustomTo(value); }}
            onApplyCustom={() => {
              if (!customFrom || !customTo) { setCustomError("Les deux dates sont obligatoires."); return; }
              if (customFrom > customTo) { setCustomError("La date de début doit précéder la date de fin."); return; }
              setCustomError("");
              setCustomApplied(true);
              setPeriod("custom");
            }}
            customError={customError}
          />
        </header>

        <section className="dashboard-kpis">
          <article className="kpi-card">
            <div className="kpi-header"><span className="kpi-label">À payer</span><Wallet size={16} /></div>
            <strong>{money(summary?.kpis.payable ?? 0, summary?.currency ?? "EUR")}</strong>
            <small>{summary?.kpis.payableCount ?? 0} facture{summary?.kpis.payableCount === 1 ? "" : "s"}</small>
          </article>
          <article className="kpi-card">
            <div className="kpi-header"><span className="kpi-label">À recevoir</span><BadgeDollarSign size={16} /></div>
            <strong>{money(summary?.kpis.receivable ?? 0, summary?.currency ?? "EUR")}</strong>
            <small>{summary?.kpis.receivableCount ?? 0} facture{summary?.kpis.receivableCount === 1 ? "" : "s"}</small>
          </article>
          <article className="kpi-card">
            <div className="kpi-header"><span className="kpi-label">Dépenses</span><Landmark size={16} /></div>
            <strong>{money(summary?.kpis.expenses ?? 0, summary?.currency ?? "EUR")}</strong>
            <small>{summary?.kpis.expenseCount ?? 0} opération{summary?.kpis.expenseCount === 1 ? "" : "s"}</small>
          </article>
          <article className="kpi-card">
            <div className="kpi-header"><span className="kpi-label">En retard</span><CircleAlert size={16} /></div>
            <strong>{money(summary?.kpis.overdue ?? 0, summary?.currency ?? "EUR")}</strong>
            <small>{summary?.kpis.deadlineCount ?? 0} élément{summary?.kpis.deadlineCount === 1 ? "" : "s"}</small>
          </article>
        </section>

        <section className="dashboard-body">
          <div className="panel panel-chart">
            <div className="panel-header">
              <div>
                <p className="eyebrow">FLUX FINANCIERS</p>
                <h2>Évolution financière</h2>
              </div>
              <span className="pill">{summary?.period.from || "—"} → {summary?.period.to || "—"}</span>
            </div>
            {summary && summary.chart.length > 0 ? (
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={summary.chart} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#2f8f5f" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2f8f5f" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#cf674d" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#cf674d" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [money(Number(value ?? 0), summary.currency), name === "income" ? "Entrées" : name === "expenses" ? "Sorties" : "Net"]}
                      labelFormatter={(label) => dateLabel(String(label), { day: "numeric", month: "long", year: "numeric" })}
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)" }}
                      labelStyle={{ color: "var(--ink)" }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 18, fontSize: 12 }} />
                    <Area type="monotone" dataKey="income" name="Entrées" stroke="#2f8f5f" fill="url(#incomeFill)" strokeWidth={2.2} />
                    <Area type="monotone" dataKey="expenses" name="Sorties" stroke="#cf674d" fill="url(#expenseFill)" strokeWidth={2.2} />
                    <Line type="monotone" dataKey="net" name="Net" stroke="var(--ink)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-box"><ArrowUpRight size={18} /><div><strong>Aucune donnée financière pour cette période</strong><p>Les données apparaîtront ici lorsque votre activité financière sera enregistrée.</p></div></div>
            )}
          </div>

          <div className="panel panel-tasks">
            <div className="panel-header">
              <div>
                <p className="eyebrow">À FAIRE MAINTENANT</p>
                <h2>Priorités</h2>
              </div>
            </div>
            {tasks.length > 0 ? (
              <div className="task-list">
                {tasks.map((task) => (
                  <div className="task-item" key={task.label}>
                    <span>{task.label}</span>
                    <Link href="/dashboard">{task.value} <ArrowUpRight size={14} /></Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-box compact task-empty"><Bell size={18} /><div><strong>Tout est à jour</strong><p>Aucune action urgente à traiter.</p></div></div>
            )}
          </div>
        </section>

        <section className="dashboard-lower">
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">PROCHAINES ÉCHÉANCES</p>
                <h2>À venir</h2>
              </div>
            </div>
            {summary && summary.upcomingDeadlines.length > 0 ? (
              <div className="mini-list">
                {summary.upcomingDeadlines.map((item) => (
                  <div className="mini-row" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.thirdParty || item.description} · {dateLabel(item.dueDate, { day: "numeric", month: "short" })}</small>
                    </div>
                    <span className={`status-dot ${item.status}`}>{item.amount !== null ? money(item.amount, summary?.currency ?? "EUR") : "—"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-box compact"><FileText size={18} /><p>Aucune échéance à venir.</p></div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">ACTIVITÉ RÉCENTE</p>
                <h2>Derniers mouvements</h2>
              </div>
            </div>
            {summary && summary.recentActivity.length > 0 ? (
              <div className="mini-list">
                {summary.recentActivity.map((item) => (
                  <div className="mini-row" key={item.id}>
                    <div>
                      <strong>{item.description}</strong>
                      <small>{dateLabel(item.date)}</small>
                    </div>
                    <span className={item.direction === "in" ? "positive" : "negative"}>{item.direction === "in" ? "+" : "-"}{money(item.amount, summary?.currency ?? "EUR")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-box compact"><FileText size={18} /><p>Aucune activité récente.</p></div>
            )}
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">JOURNAL</p>
              <h2>Activité financière</h2>
            </div>
            <span className="panel-meta">{summary?.recentActivity.length ?? 0} mouvement{summary?.recentActivity.length === 1 ? "" : "s"}</span>
          </div>
          {summary && summary.recentActivity.length > 0 ? (
            <div className="activity-table-wrap">
              <table className="activity-table">
                <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Tiers</th><th>Catégorie</th><th className="amount-cell">Entrée</th><th className="amount-cell">Sortie</th></tr></thead>
                <tbody>{summary.recentActivity.map((item) => <tr key={item.id}>
                  <td data-label="Date">{dateLabel(item.date, { day: "numeric", month: "short" })}</td>
                  <td data-label="Type"><span className={`activity-type ${item.type}`}>{item.type === "invoice" ? "Facture" : "Dépense"}</span></td>
                  <td data-label="Description"><strong>{item.description}</strong></td>
                  <td data-label="Tiers">{item.thirdParty || "—"}</td>
                  <td data-label="Catégorie">{item.category || "—"}</td>
                  <td data-label="Entrée" className="amount-cell positive">{item.direction === "in" ? money(item.amount, summary.currency) : "—"}</td>
                  <td data-label="Sortie" className="amount-cell negative">{item.direction === "out" ? money(item.amount, summary.currency) : "—"}</td>
                </tr>)}</tbody>
              </table>
            </div>
          ) : <div className="empty-box table-empty"><FileText size={18} /><div><strong>Aucune activité financière</strong><p>Les opérations enregistrées apparaîtront ici.</p></div></div>}
        </section>

        {isEmpty && (
          <section className="empty-hero">
            <div className="empty-icon"><FileText size={24} /></div>
            <p className="eyebrow">TABLEAU DE BORD VIDE</p>
            <h2>Votre tableau de bord est prêt.</h2>
            <p>Importez vos premiers documents pour commencer à suivre l’activité financière de votre entreprise.</p>
          </section>
        )}
      </div>
    </main>
  );
}
