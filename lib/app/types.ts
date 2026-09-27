export type Theme = "light" | "dark" | "system";
export type Density = "compact" | "standard" | "comfortable";
export type Language = "fr" | "en" | "es" | "pt" | "it" | "de" | "zh" | "ja" | "ar";
export type AnimationMode = "enabled" | "reduced" | "disabled";

export type NotificationPreferences = {
  deadlines_new: boolean;
  deadlines_soon: boolean;
  overdue_invoices: boolean;
  financial_analysis: boolean;
  ai_recommendations: boolean;
  financial_alerts: boolean;
  email: boolean;
};

export type DashboardPreferences = {
  visibleWidgets: string[];
  widgetOrder: string[];
};

export type AppPreferences = {
  language: Language;
  theme: Theme;
  density: Density;
  sidebar_compact: boolean;
  animation_mode: AnimationMode;
  dashboard_preferences: DashboardPreferences;
  notifications: NotificationPreferences;
};

export const defaultAppPreferences: AppPreferences = {
  language: "fr",
  theme: "system",
  density: "standard",
  sidebar_compact: false,
  animation_mode: "enabled",
  dashboard_preferences: { visibleWidgets: [], widgetOrder: [] },
  notifications: {
    deadlines_new: true,
    deadlines_soon: true,
    overdue_invoices: true,
    financial_analysis: true,
    ai_recommendations: true,
    financial_alerts: true,
    email: true,
  },
};