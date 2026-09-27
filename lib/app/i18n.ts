import type { Language } from "@/lib/app/types";

type NavigationCopy = {
  overview: string;
  finance: string;
  relations: string;
  documents: string;
  intelligence: string;
  system: string;
  home: string;
  invoices: string;
  expenses: string;
  deadlines: string;
  customers: string;
  suppliers: string;
  documentList: string;
  alerts: string;
  aiCfo: string;
  settings: string;
  menu: string;
  collapse: string;
};

const copies: Record<Language, NavigationCopy> = {
  fr: { overview: "Vue générale", finance: "Finance", relations: "Relations", documents: "Documents", intelligence: "Intelligence", system: "Système", home: "Accueil", invoices: "Factures", expenses: "Dépenses", deadlines: "Échéances", customers: "Clients", suppliers: "Fournisseurs", documentList: "Documents", alerts: "Alertes", aiCfo: "AI CFO", settings: "Paramètres", menu: "Ouvrir le menu", collapse: "Réduire la barre" },
  en: { overview: "Overview", finance: "Finance", relations: "Relations", documents: "Documents", intelligence: "Intelligence", system: "System", home: "Home", invoices: "Invoices", expenses: "Expenses", deadlines: "Deadlines", customers: "Customers", suppliers: "Suppliers", documentList: "Documents", alerts: "Alerts", aiCfo: "AI CFO", settings: "Settings", menu: "Open menu", collapse: "Collapse sidebar" },
  es: { overview: "Resumen", finance: "Finanzas", relations: "Relaciones", documents: "Documentos", intelligence: "Inteligencia", system: "Sistema", home: "Inicio", invoices: "Facturas", expenses: "Gastos", deadlines: "Vencimientos", customers: "Clientes", suppliers: "Proveedores", documentList: "Documentos", alerts: "Alertas", aiCfo: "AI CFO", settings: "Configuración", menu: "Abrir menú", collapse: "Contraer barra" },
  pt: { overview: "Visão geral", finance: "Finanças", relations: "Relações", documents: "Documentos", intelligence: "Inteligência", system: "Sistema", home: "Início", invoices: "Faturas", expenses: "Despesas", deadlines: "Prazos", customers: "Clientes", suppliers: "Fornecedores", documentList: "Documentos", alerts: "Alertas", aiCfo: "AI CFO", settings: "Definições", menu: "Abrir menu", collapse: "Recolher barra" },
  it: { overview: "Panoramica", finance: "Finanza", relations: "Relazioni", documents: "Documenti", intelligence: "Intelligenza", system: "Sistema", home: "Home", invoices: "Fatture", expenses: "Spese", deadlines: "Scadenze", customers: "Clienti", suppliers: "Fornitori", documentList: "Documenti", alerts: "Avvisi", aiCfo: "AI CFO", settings: "Impostazioni", menu: "Apri menu", collapse: "Riduci barra" },
  de: { overview: "Übersicht", finance: "Finanzen", relations: "Kontakte", documents: "Dokumente", intelligence: "Intelligenz", system: "System", home: "Startseite", invoices: "Rechnungen", expenses: "Ausgaben", deadlines: "Fristen", customers: "Kunden", suppliers: "Lieferanten", documentList: "Dokumente", alerts: "Warnungen", aiCfo: "AI CFO", settings: "Einstellungen", menu: "Menü öffnen", collapse: "Leiste einklappen" },
  zh: { overview: "总览", finance: "财务", relations: "关系", documents: "文档", intelligence: "智能", system: "系统", home: "首页", invoices: "发票", expenses: "支出", deadlines: "截止日期", customers: "客户", suppliers: "供应商", documentList: "文档", alerts: "提醒", aiCfo: "AI CFO", settings: "设置", menu: "打开菜单", collapse: "收起侧栏" },
  ja: { overview: "概要", finance: "財務", relations: "関係先", documents: "書類", intelligence: "インテリジェンス", system: "システム", home: "ホーム", invoices: "請求書", expenses: "経費", deadlines: "期限", customers: "顧客", suppliers: "仕入先", documentList: "書類", alerts: "アラート", aiCfo: "AI CFO", settings: "設定", menu: "メニューを開く", collapse: "サイドバーを折りたたむ" },
  ar: { overview: "نظرة عامة", finance: "المالية", relations: "العلاقات", documents: "المستندات", intelligence: "الذكاء", system: "النظام", home: "الرئيسية", invoices: "الفواتير", expenses: "المصروفات", deadlines: "المواعيد", customers: "العملاء", suppliers: "الموردون", documentList: "المستندات", alerts: "التنبيهات", aiCfo: "AI CFO", settings: "الإعدادات", menu: "فتح القائمة", collapse: "طي الشريط" },
};

export function navigationCopy(language: Language): NavigationCopy { return copies[language]; }