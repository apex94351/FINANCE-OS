"use client";

import { type ChangeEvent, type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDownAZ, ArrowLeft, Download, Eye, FileText, Filter, LoaderCircle, Search, Trash2, UploadCloud, X } from "lucide-react";
import { formatDocumentSize, isSupportedDocument, type DocumentRecord } from "@/lib/documents/types";

type FilterKind = "all" | "pdf" | "image";
type SortOrder = "newest" | "oldest" | "name-asc" | "name-desc";
type Notice = { type: "success" | "error"; text: string };
type DetailResponse = { document: DocumentRecord; url: string };

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function documentKind(document: Pick<DocumentRecord, "mime_type">): "PDF" | "Image" {
  return document.mime_type === "application/pdf" ? "PDF" : "Image";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function errorMessage(code: string | undefined): string {
  const messages: Record<string, string> = {
    unsupported_file_type: "Ce type de fichier n’est pas accepté.",
    invalid_file_size: "Le fichier dépasse la limite de 10 Mo.",
    invalid_file_content: "Le contenu du fichier ne correspond pas à son type.",
    company_required: "Aucune entreprise n’est associée à votre compte.",
    not_authenticated: "Votre session a expiré. Connectez-vous à nouveau.",
    upload_failed: "Impossible d’importer le document. Veuillez réessayer.",
    document_record_failed: "Le document n’a pas pu être enregistré.",
  };
  return messages[code ?? ""] ?? "Une erreur est survenue. Veuillez réessayer.";
}

function uploadWithProgress(file: File, onProgress: (value: number) => void): Promise<DocumentRecord> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/documents/upload");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      let payload: { document?: DocumentRecord; error?: string } = {};
      try { payload = JSON.parse(request.responseText) as typeof payload; } catch { reject(new Error("upload_failed")); return; }
      if (request.status < 200 || request.status >= 300 || !payload.document) { reject(new Error(payload.error ?? "upload_failed")); return; }
      onProgress(100);
      resolve(payload.document);
    });
    request.addEventListener("error", () => reject(new Error("upload_failed")));
    const body = new FormData();
    body.append("file", file);
    request.send(body);
  });
}

export default function DocumentsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKind>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selected, setSelected] = useState<DetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch("/api/documents", { cache: "no-store" });
    if (response.status === 401) { window.location.assign("/login"); return; }
    const payload: { documents?: DocumentRecord[]; error?: string } = await response.json().catch(() => ({}));
    if (!response.ok) setNotice({ type: "error", text: "Impossible de charger vos documents." });
    else setDocuments(payload.documents ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  async function upload(file: File) {
    setNotice(null);
    if (!isSupportedDocument(file)) {
      setNotice({ type: "error", text: file.size > MAX_FILE_SIZE ? "Le fichier dépasse la limite de 10 Mo." : "Ce type de fichier n’est pas accepté." });
      return;
    }
    setUploadProgress(0);
    try {
      const document = await uploadWithProgress(file, setUploadProgress);
      setDocuments((current) => [document, ...current]);
      setNotice({ type: "success", text: "Document importé avec succès." });
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error instanceof Error ? error.message : undefined) });
    } finally {
      setUploadProgress(null);
    }
  }

  function handleFiles(files: FileList | null) { const file = files?.[0]; if (file) void upload(file); }
  function handleInput(event: ChangeEvent<HTMLInputElement>) { handleFiles(event.target.files); event.target.value = ""; }
  function handleDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); handleFiles(event.dataTransfer.files); }

  async function openDocument(id: string) {
    setDetailLoading(true);
    const response = await fetch(`/api/documents/${id}`);
    const payload: DetailResponse | { error?: string } = await response.json().catch(() => ({}));
    if (!response.ok || !("document" in payload)) setNotice({ type: "error", text: "Impossible d’ouvrir ce document." });
    else setSelected(payload);
    setDetailLoading(false);
  }

  async function removeDocument(id: string) {
    if (!window.confirm("Supprimer ce document ? Le fichier sera supprimé définitivement.")) return;
    setDeletingId(id);
    const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!response.ok) setNotice({ type: "error", text: "Impossible de supprimer le document." });
    else { setDocuments((current) => current.filter((document) => document.id !== id)); setSelected(null); setNotice({ type: "success", text: "Document supprimé." }); }
    setDeletingId(null);
  }

  const visibleDocuments = useMemo(() => documents.filter((document) => {
    const matchesSearch = document.name.toLocaleLowerCase("fr").includes(search.toLocaleLowerCase("fr"));
    const matchesFilter = filter === "all" || (filter === "pdf" && document.mime_type === "application/pdf") || (filter === "image" && document.mime_type.startsWith("image/"));
    return matchesSearch && matchesFilter;
  }).sort((a, b) => sort === "name-asc" ? a.name.localeCompare(b.name, "fr") : sort === "name-desc" ? b.name.localeCompare(a.name, "fr") : sort === "oldest" ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at)), [documents, filter, search, sort]);

  return <main className="documents-page"><div className="documents-inner">
    <div className="documents-top"><a className="documents-back" href="/dashboard"><ArrowLeft size={15} /> Retour au dashboard</a><span className="documents-private"><span /> Espace privé de votre entreprise</span></div>
    <header className="documents-heading"><div><p className="eyebrow"><span className="eyebrow-mark" /> ESPACE DOCUMENTAIRE</p><h1>Documents</h1><p>Centralisez vos documents financiers au même endroit.</p></div><button className="button button-dark" type="button" onClick={() => inputRef.current?.click()} disabled={uploadProgress !== null}><UploadCloud size={16} /> {uploadProgress === null ? "Importer un document" : "Importation..."}</button><input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png" hidden onChange={handleInput} /></header>
    {notice && <div className={`documents-message ${notice.type}`} role="status"><span>{notice.text}</span><button type="button" aria-label="Fermer" onClick={() => setNotice(null)}><X size={15} /></button></div>}
    <div className="document-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}><div className="dropzone-icon"><UploadCloud size={24} /></div><strong>Glissez-déposez votre document ici</strong><span>ou <button type="button" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}>sélectionnez un fichier</button></span><small>PDF, JPG, JPEG ou PNG · 10 Mo maximum</small>{uploadProgress !== null && <div className="upload-progress-wrap"><div className="upload-progress-label"><span>Importation en cours</span><strong>{uploadProgress} %</strong></div><progress className="upload-progress" max="100" value={uploadProgress} /></div>}</div>
    <div className="documents-toolbar"><label className="document-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un document..." /></label><div className="document-controls"><label><Filter size={14} /><select value={filter} onChange={(event) => setFilter(event.target.value as FilterKind)} aria-label="Filtrer les documents"><option value="all">Tous</option><option value="pdf">PDF</option><option value="image">Images</option></select></label><label><ArrowDownAZ size={14} /><select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)} aria-label="Trier les documents"><option value="newest">Plus récent</option><option value="oldest">Plus ancien</option><option value="name-asc">Nom A → Z</option><option value="name-desc">Nom Z → A</option></select></label></div></div>
    {isLoading ? <div className="document-skeleton-list">{[1, 2, 3].map((item) => <div className="document-skeleton" key={item}><span /><div><b /><i /></div><em /></div>)}</div> : visibleDocuments.length === 0 ? <section className="document-empty"><div className="empty-document-icon"><FileText size={25} /></div><h2>{search || filter !== "all" ? "Aucun document trouvé" : "Aucun document"}</h2><p>{search || filter !== "all" ? "Modifiez votre recherche ou votre filtre." : "Importez votre première facture ou votre premier document financier pour commencer."}</p>{!search && filter === "all" && <button className="button button-dark" type="button" onClick={() => inputRef.current?.click()}><UploadCloud size={15} /> Importer un document</button>}</section> : <section className="document-list"><div className="document-list-head"><span>Document</span><span>Type</span><span>Taille</span><span>Date</span><span>Statut</span><span>Actions</span></div>{visibleDocuments.map((document) => <article className="document-row" key={document.id}><div className="document-main"><span className={`document-icon ${documentKind(document).toLowerCase()}`}><FileText size={18} /></span><div><strong title={document.name}>{document.name}</strong><small>{document.document_type === "other" ? "Document non classé" : document.document_type}</small></div></div><span className="document-type">{documentKind(document)}</span><span className="document-size">{formatDocumentSize(document.size_bytes)}</span><span className="document-date">{formatDate(document.created_at)}</span><span className="document-status"><i /> Importé</span><div className="document-actions"><button type="button" onClick={() => void openDocument(document.id)} aria-label={`Ouvrir ${document.name}`} title="Ouvrir"><Eye size={16} /></button><button type="button" onClick={() => void removeDocument(document.id)} disabled={deletingId === document.id} aria-label={`Supprimer ${document.name}`} title="Supprimer"><Trash2 size={16} /></button></div></article>)}</section>}
    <p className="documents-count">{visibleDocuments.length} document{visibleDocuments.length === 1 ? "" : "s"} affiché{visibleDocuments.length === 1 ? "" : "s"}</p>
  </div>
  {detailLoading && <div className="document-modal-backdrop"><div className="document-modal-loading"><LoaderCircle size={22} className="spin" /> Ouverture du document...</div></div>}
  {selected && <div className="document-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="document-modal" role="dialog" aria-modal="true" aria-labelledby="document-modal-title"><header><div><p className="eyebrow">APERÇU DU DOCUMENT</p><h2 id="document-modal-title">{selected.document.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Fermer"><X size={18} /></button></header><div className="document-preview">{selected.document.mime_type.startsWith("image/") ? <Image src={selected.url} alt={selected.document.name} width={1200} height={900} unoptimized /> : <iframe src={selected.url} title={`Aperçu de ${selected.document.name}`} />}</div><div className="document-detail-meta"><span><b>Type</b>{documentKind(selected.document)}</span><span><b>Taille</b>{formatDocumentSize(selected.document.size_bytes)}</span><span><b>Importé le</b>{formatDate(selected.document.created_at)}</span></div><footer><a className="button button-light" href={selected.url} target="_blank" rel="noreferrer"><Download size={15} /> Télécharger</a><button className="button button-danger" type="button" onClick={() => void removeDocument(selected.document.id)}><Trash2 size={15} /> Supprimer</button></footer></section></div>}
+  </main>;
}
