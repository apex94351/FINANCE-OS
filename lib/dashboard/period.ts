import type { PeriodPreset } from "@/lib/dashboard/types";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getPeriodRange(preset: PeriodPreset, customFrom = "", customTo = ""): { from: string; to: string } {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (preset === "custom") {
    const fromDate = customFrom ? new Date(`${customFrom}T00:00:00`) : new Date(NaN);
    const toDate = customTo ? new Date(`${customTo}T00:00:00`) : new Date(NaN);
    return {
      from: Number.isNaN(fromDate.getTime()) ? "" : toIsoDate(fromDate),
      to: Number.isNaN(toDate.getTime()) ? "" : toIsoDate(toDate),
    };
  }

  const from = new Date(end);
  switch (preset) {
    case "today":
      from.setHours(0, 0, 0, 0);
      return { from: toIsoDate(from), to: toIsoDate(end) };
    case "7d":
      from.setDate(end.getDate() - 6);
      return { from: toIsoDate(from), to: toIsoDate(end) };
    case "30d":
      from.setDate(end.getDate() - 29);
      return { from: toIsoDate(from), to: toIsoDate(end) };
    case "3m":
      from.setMonth(end.getMonth() - 2);
      return { from: toIsoDate(from), to: toIsoDate(end) };
    case "6m":
      from.setMonth(end.getMonth() - 5);
      return { from: toIsoDate(from), to: toIsoDate(end) };
    case "1y":
      from.setFullYear(end.getFullYear() - 1);
      return { from: toIsoDate(from), to: toIsoDate(end) };
    case "all":
      from.setFullYear(2000);
      return { from: toIsoDate(from), to: toIsoDate(end) };
    default:
      return { from: toIsoDate(end), to: toIsoDate(end) };
  }
}
