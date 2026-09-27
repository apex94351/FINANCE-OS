import Link from "next/link";

export default function VerifyEmailPage() {
  return <main className="auth-page"><div className="auth-card"><Link className="brand" href="/"><span className="brand-mark">A</span><span>AI Finance <em>OS</em></span></Link><div className="auth-heading"><p className="eyebrow">VÉRIFICATION</p><h1>Vérifiez votre email.</h1><p>Ouvrez le lien reçu dans votre boîte de réception pour confirmer votre compte. Vous pourrez ensuite vous connecter.</p></div><Link className="button button-dark" href="/login">Retour à la connexion</Link></div></main>;
}