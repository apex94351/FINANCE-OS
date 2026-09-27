import Link from "next/link";
import { ArrowRight, Check, FileText, ShieldCheck, Sparkles, Timer } from "lucide-react";

const principles = [
  [FileText, "Un espace pour vos documents", "Centralisez vos factures et justificatifs dans un espace privé, prêt pour vos vrais flux."],
  [Timer, "Les échéances en vue", "Repérez ce qui demande votre attention sans parcourir plusieurs outils."],
  [Sparkles, "L'IA comme copilote", "Faites émerger les informations utiles, avec une validation avant chaque action."],
] as const;

export default function HomePage() {
  return <main>
    <nav className="marketing-nav container">
      <Link className="brand" href="/" aria-label="AI Finance OS, accueil"><span className="brand-mark">A</span><span>AI Finance <em>OS</em></span></Link>
      <div className="nav-actions"><Link className="text-link" href="#principes">Le produit</Link><Link className="text-link" href="#securite">Sécurité</Link><Link className="text-link auth-nav-link" href="/login">Se connecter</Link><Link className="button button-small button-light auth-nav-link" href="/register">Créer un compte</Link><Link className="button button-small button-dark desktop-space-link" href="/dashboard">Ouvrir l’espace <ArrowRight size={15} /></Link><details className="mobile-nav"><summary aria-label="Ouvrir le menu">Menu</summary><div className="mobile-nav-panel"><Link href="/login">Se connecter</Link><Link href="/register">Créer un compte</Link><Link href="/dashboard">Ouvrir l’espace</Link></div></details></div>
    </nav>
    <section className="hero container">
      <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot" /> Le copilote financier des entreprises agiles</p><h1>Votre finance d’entreprise, <span>enfin organisée.</span></h1><p className="hero-lede">AI Finance OS transforme vos documents financiers en informations claires, échéances et prochaines actions.</p><div className="hero-actions"><Link className="button button-dark" href="/dashboard">Commencer avec un espace vide <ArrowRight size={17} /></Link><Link className="text-link text-link-underlined" href="#principes">Voir comment ça marche</Link></div><div className="trust-line"><ShieldCheck size={16} /> Vos données restent privées par conception</div></div>
      <div className="hero-art" aria-label="Aperçu abstrait de l’espace financier"><div className="hero-art-grid" /><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="signal-card signal-main"><span className="signal-label">VOTRE ESPACE</span><strong>Prêt à commencer</strong><div className="signal-line"><span /><span /><span /></div></div><div className="signal-card signal-side"><span className="signal-label">DOCUMENTS</span><strong>0 importé</strong><small>Votre première facture peut entrer ici.</small></div><span className="art-caption">01 / une vision nette</span></div>
    </section>
    <section className="principles container" id="principes"><div className="section-intro"><p className="eyebrow">Le point de départ</p><h2>Moins de chasse à l’information.<br /><span>Plus de décisions sereines.</span></h2></div><div className="principle-grid">{principles.map(([Icon, title, text]) => <article className="principle" key={title}><Icon size={20} strokeWidth={1.7} /><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="security-band" id="securite"><div className="container security-content"><div><p className="eyebrow">Confiance par défaut</p><h2>Les finances de votre entreprise méritent mieux qu’un tableur dispersé.</h2></div><div className="security-points"><p><Check size={17} /> Données privées, sans démonstration fictive</p><p><Check size={17} /> Actions sensibles toujours confirmées</p><p><Check size={17} /> Une base prête pour votre vraie activité</p></div></div></section>
    <footer className="marketing-footer container"><Link className="brand" href="/"><span className="brand-mark">A</span><span>AI Finance <em>OS</em></span></Link><span>Fondation produit — v0.1</span></footer>
  </main>;
}