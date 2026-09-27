"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmation: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setMessage(null);
    if (form.password.length < 10) return setError("Le mot de passe doit contenir au moins 10 caractères.");
    if (form.password !== form.confirmation) return setError("Les mots de passe ne correspondent pas.");
    setIsLoading(true);
    const { data, error: signUpError } = await createClient().auth.signUp({ email: form.email, password: form.password, options: { data: { first_name: form.firstName, last_name: form.lastName }, emailRedirectTo: `${window.location.origin}/verify-email` } });
    setIsLoading(false);
    if (signUpError) return setError("Impossible de créer le compte. Vérifiez vos informations et réessayez.");
    setMessage(data.session ? "Votre compte est prêt. Vous pouvez accéder à votre espace." : "Un email de confirmation vous a été envoyé.");
  }

  return <main className="auth-page"><div className="auth-card auth-card-wide"><Link className="brand" href="/"><span className="brand-mark">A</span><span>AI Finance <em>OS</em></span></Link><div className="auth-heading"><p className="eyebrow">NOUVEL ESPACE</p><h1>Créer mon compte.</h1><p>Commencez avec un espace financier privé et prêt pour votre entreprise.</p></div>{message ? <div className="form-success" role="status"><strong>Compte créé</strong><p>{message}</p><Link className="button button-dark" href="/login">Se connecter</Link></div> : <form className="auth-form" onSubmit={handleSubmit}><div className="form-grid"><label>Prénom<input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required autoComplete="given-name" /></label><label>Nom<input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required autoComplete="family-name" /></label></div><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required autoComplete="email" /></label><label>Mot de passe<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={10} autoComplete="new-password" /></label><label>Confirmer le mot de passe<input type="password" value={form.confirmation} onChange={(event) => setForm({ ...form, confirmation: event.target.value })} required autoComplete="new-password" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark" type="submit" disabled={isLoading}>{isLoading ? "Création…" : "Créer mon compte"}</button></form>}<div className="auth-links"><span>Vous avez déjà un compte ? <Link href="/login">Se connecter</Link></span></div></div></main>;
}