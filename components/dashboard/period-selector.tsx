"use client";

import type { PeriodPreset } from "@/lib/dashboard/types";

export function PeriodSelector({
  value,
  onChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  onApplyCustom,
  customError,
}: {
  value: PeriodPreset;
  onChange: (next: PeriodPreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (next: string) => void;
  onCustomToChange: (next: string) => void;
  onApplyCustom: () => void;
  customError?: string;
}) {
  return (
    <div className="period-selector">
      <select value={value} onChange={(event) => onChange(event.target.value as PeriodPreset)} aria-label="Période du tableau de bord">
        <option value="today">Aujourd’hui</option>
        <option value="7d">7 derniers jours</option>
        <option value="30d">30 derniers jours</option>
        <option value="3m">3 derniers mois</option>
        <option value="6m">6 derniers mois</option>
        <option value="1y">12 derniers mois</option>
        <option value="all">Tout</option>
        <option value="custom">Personnalisée</option>
      </select>
      {value === "custom" && (
        <div className="period-custom">
          <label>Date de début<input type="date" value={customFrom} onChange={(event) => onCustomFromChange(event.target.value)} aria-label="Date de début" /></label>
          <label>Date de fin<input type="date" value={customTo} onChange={(event) => onCustomToChange(event.target.value)} aria-label="Date de fin" /></label>
          <button type="button" onClick={onApplyCustom}>Appliquer</button>
          {customError && <p className="period-error" role="alert">{customError}</p>}
        </div>
      )}
    </div>
  );
}
