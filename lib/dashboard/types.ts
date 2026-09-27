export type PeriodPreset = "today" | "7d" | "30d" | "3m" | "6m" | "1y" | "all" | "custom";

export type DashboardChartPoint = {
  date: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
};

export type DashboardActivity = {
  id: string;
  type: "invoice" | "expense" | "payment" | "deadline";
  description: string;
  thirdParty: string;
  category: string;
  date: string;
  amount: number;
  direction: "in" | "out";
};

export type DashboardDeadline = {
  id: string;
  title: string;
  thirdParty: string;
  description: string;
  dueDate: string;
  amount: number | null;
  status: "upcoming" | "today" | "overdue" | "completed";
};

export type DashboardSummary = {
  currency: string;
  period: { from: string; to: string; preset: PeriodPreset };
  kpis: {
    payable: number;
    payableCount: number;
    receivable: number;
    receivableCount: number;
    expenses: number;
    overdue: number;
    invoiceCount: number;
    expenseCount: number;
    deadlineCount: number;
  };
  chart: DashboardChartPoint[];
  recentActivity: DashboardActivity[];
  upcomingDeadlines: DashboardDeadline[];
};

export type DashboardResponse = DashboardSummary & { error?: "dashboard_unavailable" };

export function emptyDashboardSummary(preset: PeriodPreset = "30d", from = "", to = ""): DashboardSummary {
  return {
    currency: "EUR",
    period: { from: from || "", to: to || "", preset },
    kpis: {
      payable: 0,
      payableCount: 0,
      receivable: 0,
      receivableCount: 0,
      expenses: 0,
      overdue: 0,
      invoiceCount: 0,
      expenseCount: 0,
      deadlineCount: 0,
    },
    chart: [],
    recentActivity: [],
    upcomingDeadlines: [],
  };
}