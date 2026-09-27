"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [error, setError] = useState<string | null>(null); const [isLoading, setIsLoading] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(null); setIsLoading(true); const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); setIsLoading(false); if (resetError) return setError("Impossible d’envoyer cet email pour le moment."); setSent(true); }
  return <main className="auth-page"><div className="auth-card"><Link className="brand" href="/"><span className="brand-mark">A</span><span>AI Finance <em>OS</em></span></Link><div className="auth-heading"><p className="eyebrow">ACCÈS AU COMPTE</p><h1>Réinitialiser le mot de passe.</h1><p>{sent ? "Si un compte correspond à cette adresse, un lien vient d’être envoyé." : "Saisissez votre email pour recevoir un lien sécurisé."}</p></div>{sent ? <div className="form-success" role="status"><p>Consultez votre boîte de réception, puis ouvrez le lien pour choisir un nouveau mot de passe.</p><Link className="button button-light" href="/login">Retour à la connexion</Link></div> : <form className="auth-form" onSubmit={handleSubmit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark" type="submit" disabled={isLoading}>{isLoading ? "Envoi…" : "Envoyer le lien"}</button></form>}<div className="auth-links"><Link href="/login">Retour à la connexion</Link></div></div></main>;
}