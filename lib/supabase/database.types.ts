type Table<Row extends object, Insert extends object = Row, Update extends object = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type Profile = { id: string; first_name: string; last_name: string; avatar_url: string | null; created_at: string; updated_at: string };
type Company = { id: string; name: string; trade_name: string | null; legal_form: string | null; logo_url: string | null; country: string | null; currency: string; address: string | null; address_complement: string | null; city: string | null; postal_code: string | null; siret: string | null; siren: string | null; phone: string | null; email: string | null; registration_number: string | null; vat_number: string | null; industry: string | null; created_at: string; updated_at: string };
type CompanyMember = { company_id: string; user_id: string; role: "owner" | "admin" | "member" | "viewer" | "accountant"; created_at: string };
type UserPreferences = { user_id: string; language: "fr" | "en" | "es" | "pt" | "it" | "de" | "zh" | "ja" | "ar"; theme: "light" | "dark" | "system"; density: "comfortable" | "standard" | "compact"; sidebar_compact: boolean; reduce_motion: boolean; animation_mode: "enabled" | "reduced" | "disabled"; dashboard_preferences: Record<string, string[]>; notifications: Record<string, boolean>; updated_at: string };
type Document = { id: string; user_id: string; company_id: string | null; uploaded_by: string; storage_path: string; name: string; mime_type: string; size_bytes: number; file_name: string; file_type: string; file_size: number; document_type: "invoice" | "contract" | "receipt" | "statement" | "tax_document" | "other"; status: "uploaded" | "processing" | "analyzed" | "error"; created_at: string; updated_at: string; deleted_at: string | null };
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
  subtotal_ht: number;
  vat_amount: number;
  vat_rate: number;
  total_ttc: number;
  currency: string;
  status: "draft" | "to_pay" | "paid" | "overdue";
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
type Expense = { id: string; company_id: string; description: string; category: string; amount: number; currency: string; expense_date: string | null; supplier_id: string | null; document_id: string | null; created_at: string; updated_at: string };
type Deadline = { id: string; company_id: string; title: string; due_date: string; completed: boolean; amount: number | null; deadline_type: "invoice" | "contract" | "subscription" | "tax" | "document" | "other"; status: "upcoming" | "today" | "overdue" | "completed"; source: string | null; created_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, Omit<Profile, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string }>;
      companies: Table<Company, Omit<Company, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }>;
      company_members: Table<CompanyMember, Omit<CompanyMember, "created_at"> & { created_at?: string }>;
      user_preferences: Table<UserPreferences, Omit<UserPreferences, "updated_at"> & { updated_at?: string }>;
      documents: Table<Document, Omit<Document, "id" | "created_at" | "updated_at" | "deleted_at"> & { id?: string; created_at?: string; updated_at?: string; deleted_at?: string | null }>;
      invoices: Table<Invoice, Omit<Invoice, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }>;
      expenses: Table<Expense, Omit<Expense, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }>;
      deadlines: Table<Deadline, Omit<Deadline, "id" | "created_at"> & { id?: string; created_at?: string }>;
    };
    Views: Record<string, never>;
    Functions: {
      create_company: { Args: { company_name: string }; Returns: string };
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: { company_role: CompanyMember["role"] };
    CompositeTypes: Record<string, never>;
  };
};