import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

export function ComingSoonPage({ title, section }: { title: string; section: string }) {
  return <main className="placeholder-page"><div className="placeholder-content"><Link className="brand" href="/dashboard"><span className="brand-mark">A</span><span>AI Finance <em>OS</em></span></Link><p className="eyebrow">{section}</p><Construction size={28} strokeWidth={1.5} /><h1>{title}</h1><p>Cette section est reliée à l’espace privé et sera activée avec les données de votre entreprise.</p><span className="coming-badge">Bientôt disponible</span><Link className="text-link text-link-underlined" href="/dashboard"><ArrowLeft size={14} /> Retour au dashboard</Link></div></main>;
}