import type { Metadata } from "next";
import "./globals.css";
import "./placeholder.css";
import "./documents/documents.css";
import "./invoices/invoices.css";
import "./invoices/detail.css";
import "./buckets.css";
import "./expenses/expenses.css";
import "./deadlines/deadlines.css";
import "./dashboard/dashboard.css";
import "./settings/settings.css";
import "./dashboard-shell-compat.css";
import "./app-shell.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "AI Finance OS | La clarté financière, enfin",
  description: "Le copilote financier intelligent des PME et TPE.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" suppressHydrationWarning><body><AppShell>{children}</AppShell></body></html>;
}