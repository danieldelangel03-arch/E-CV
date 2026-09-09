import Link from "next/link";
import { ArrowRight, CheckCircle2, QrCode, ShieldCheck, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="marketing-page">
      <nav className="marketing-nav"><Link className="brand" href="/"><span className="brand-mark">E</span><span>Profile</span></Link><Link className="button button--secondary button--small" href="/login">Iniciar sesión <ArrowRight size={15} /></Link></nav>
      <section className="marketing-hero">
        <div className="marketing-hero__mesh" />
        <div className="marketing-copy"><p className="eyebrow"><Sparkles size={14} /> Portafolios profesionales para estudiantes</p><h1>Tu trayectoria merece una <em>presencia permanente.</em></h1><p>EProfile convierte tu formación, proyectos y fortalezas en una tarjeta profesional que puedes compartir con un código QR, vCard y CV descargable.</p><div className="marketing-actions"><Link className="button button--primary" href="/login">Acceder a mi perfil <ArrowRight size={17} /></Link><a className="button button--ghost" href="#como-funciona">Conocer la plataforma</a></div></div>
        <div className="marketing-card"><div className="marketing-card__edge" /><div className="marketing-card__head"><span className="fake-avatar">DA</span><div><strong>Tu perfil EProfile</strong><small>Profesional · Compartible</small></div></div><div className="marketing-card__line marketing-card__line--wide" /><div className="marketing-card__line" /><div className="marketing-card__tags"><span>Habilidades</span><span>Proyectos</span><span>CV</span></div><div className="marketing-qr"><QrCode size={46} /><div><strong>Un solo enlace</strong><small>QR listo para compartir</small></div></div></div>
      </section>
      <section id="como-funciona" className="marketing-features"><article><span><CheckCircle2 size={22} /></span><h2>Contenido que controlas</h2><p>Prepara un borrador privado y publica solo la versión que deseas mostrar.</p></article><article><span><QrCode size={22} /></span><h2>Siempre a la mano</h2><p>Un QR, una vCard y un PDF generados desde tu perfil publicado.</p></article><article><span><ShieldCheck size={22} /></span><h2>Acceso protegido</h2><p>Las cuentas, sesiones y permisos se verifican en servidor.</p></article></section>
    </main>
  );
}
