export type DocumentStatus = "uploaded" | "processing" | "analyzed" | "error";
export type DocumentKind = "invoice" | "contract" | "receipt" | "statement" | "tax_document" | "other";

export type DocumentRecord = {
  id: string;
  user_id: string;
  company_id: string | null;
  uploaded_by: string;
  storage_path: string;
  name: string;
  mime_type: "application/pdf" | "image/jpeg" | "image/png";
  size_bytes: number;
  file_name: string;
  file_type: string;
  file_size: number;
  document_type: DocumentKind;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function isSupportedDocument(file: Pick<File, "name" | "type" | "size">): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ["pdf", "jpg", "jpeg", "png"].includes(extension ?? "") &&
    ["application/pdf", "image/jpeg", "image/png"].includes(file.type) &&
    file.size > 0 && file.size <= 10 * 1024 * 1024;
}

export function formatDocumentSize(size: number): string {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}
