"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (signInError) {
      setError("Adresse email ou mot de passe incorrect.");
      return;
    }

    router.push(new URLSearchParams(window.location.search).get("next") || "/dashboard");
    router.refresh();
  }

  return <main className="auth-page"><div className="auth-card"><Link className="brand" href="/"><span className="brand-mark">A</span><span>AI Finance <em>OS</em></span></Link><div className="auth-heading"><p className="eyebrow">ESPACE PRIVÉ</p><h1>Ravi de vous revoir.</h1><p>Connectez-vous pour retrouver votre espace financier.</p></div><form className="auth-form" onSubmit={handleSubmit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Mot de passe<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark" type="submit" disabled={isLoading}>{isLoading ? "Connexion…" : "Se connecter"}</button></form><div className="auth-links"><Link href="/forgot-password">Mot de passe oublié ?</Link><span>Pas encore de compte ? <Link href="/register">Créer un compte</Link></span></div></div></main>;
}