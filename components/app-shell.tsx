"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Building2, ChevronLeft, FileText, Gauge, LayoutDashboard, Menu, Receipt, Settings, Sparkles, Users, X } from "lucide-react";
import type { AppPreferences } from "@/lib/app/types";
import { navigationCopy } from "@/lib/app/i18n";

const publicPaths = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
const navigation = [
  { key: "home", href: "/dashboard", icon: LayoutDashboard, group: "overview" },
  { key: "invoices", href: "/invoices", icon: Receipt, group: "finance" },
  { key: "expenses", href: "/expenses", icon: Gauge, group: "finance" },
  { key: "deadlines", href: "/deadlines", icon: Bell, group: "finance" },
  { key: "customers", href: "/customers", icon: Users, group: "relations" },
  { key: "suppliers", href: "/suppliers", icon: Building2, group: "relations" },
  { key: "documentList", href: "/documents", icon: FileText, group: "documents" },
  { key: "alerts", href: "/alerts", icon: Bell, group: "intelligence" },
  { key: "aiCfo", href: "/ai-cfo", icon: Sparkles, group: "intelligence" },
  { key: "settings", href: "/settings", icon: Settings, group: "system" },
] as const;

function isPublicPath(pathname: string): boolean { return publicPaths.includes(pathname) || pathname.startsWith("/api/"); }

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [language, setLanguage] = useState<AppPreferences["language"]>("fr");
  const copy = navigationCopy(language);

  useEffect(() => {
    const stored = window.localStorage.getItem("ai-finance-preferences");
    const storedCompact = window.localStorage.getItem("ai-finance-sidebar-compact");
    if (storedCompact === "true" || storedCompact === "false") setCompact(storedCompact === "true");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<AppPreferences>;
        if (typeof parsed.sidebar_compact === "boolean") setCompact(parsed.sidebar_compact);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.theme) document.documentElement.dataset.theme = parsed.theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : parsed.theme;
        if (parsed.density) document.documentElement.dataset.density = parsed.density;
        if (parsed.animation_mode) document.documentElement.dataset.animation = parsed.animation_mode;
      } catch { window.localStorage.removeItem("ai-finance-preferences"); }
    }
  }, [pathname]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  if (isPublicPath(pathname)) return <>{children}</>;

  const groups = ["overview", "finance", "relations", "documents", "intelligence", "system"] as const;
  const groupLabel = { overview: copy.overview, finance: copy.finance, relations: copy.relations, documents: copy.documents, intelligence: copy.intelligence, system: copy.system };
  return <div className={`app-shell${compact ? " is-compact" : ""}`}><button className="mobile-menu-button" aria-label={copy.menu} onClick={() => setMobileOpen(true)}><Menu size={20} /></button>{mobileOpen && <button className="app-shell-scrim" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`app-sidebar${mobileOpen ? " is-open" : ""}`}><div className="app-sidebar-brand"><Link className="brand" href="/dashboard"><span className="brand-mark">A</span><span>AI Finance <em>OS</em></span></Link><button className="mobile-close" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)}><X size={18} /></button></div><nav className="app-nav" aria-label="Navigation principale">{groups.map((group) => <div className="app-nav-group" key={group}><span className="app-nav-label">{groupLabel[group]}</span>{navigation.filter((item) => item.group === group).map(({ key, href, icon: Icon }) => <Link className={`app-nav-link${pathname === href || pathname.startsWith(`${href}/`) ? " is-active" : ""}`} href={href} key={href}><Icon size={17} /><span>{copy[key]}</span></Link>)}</div>)}</nav><button className="app-collapse" aria-label={copy.collapse} onClick={() => { const next = !compact; setCompact(next); window.localStorage.setItem("ai-finance-sidebar-compact", String(next)); }}><ChevronLeft size={17} /><span>{copy.collapse}</span></button></aside>
    <div className="app-shell-main"><header className="app-global-header"><span className="app-breadcrumb">{copy[pathname === "/dashboard" ? "home" : pathname.split("/")[1] as keyof typeof copy] || "AI Finance OS"}</span><Link className="app-header-avatar" href="/settings" aria-label={copy.settings}>A</Link></header><main className="app-shell-content">{children}</main></div>
  </div>;
}