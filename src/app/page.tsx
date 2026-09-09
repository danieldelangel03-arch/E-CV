/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, CheckCircle2, QrCode, ShieldCheck, Sparkles } from "lucide-react";

import { initials } from "@/lib/content";
import { listPublicProfileShowcase } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function Home() {
  let showcase: Awaited<ReturnType<typeof listPublicProfileShowcase>> = [];
  try {
    showcase = await listPublicProfileShowcase();
  } catch {
    // La landing sigue disponible durante la configuración inicial de Neon.
  }

  return (
    <main className="marketing-page">
      <nav className="marketing-nav"><Link className="brand" href="/"><span className="brand-mark">E</span><span>E-CV</span></Link><div className="marketing-nav__actions"><Link className="button button--ghost button--small" href="/registro">Crear mi E-CV</Link><Link className="button button--secondary button--small" href="/login">Iniciar sesión <ArrowRight size={15} /></Link></div></nav>
      <section className="marketing-hero">
        <div className="marketing-hero__mesh" />
        <div className="marketing-copy"><p className="eyebrow"><Sparkles size={14} /> Tarjetas profesionales para estudiantes</p><h1>Tu tarjeta de presentación digital, <em>siempre actualizada.</em></h1><p>E-CV reúne tu formación, proyectos, habilidades y contacto en un enlace profesional que puedes compartir con QR, vCard y CV descargable.</p><div className="marketing-actions"><Link className="button button--primary" href="/registro">Crear mi E-CV gratis <ArrowRight size={17} /></Link><Link className="button button--ghost" href="/login">Iniciar sesión</Link></div></div>
        <div className="marketing-card"><div className="marketing-card__edge" /><div className="marketing-card__head"><span className="fake-avatar">EC</span><div><strong>Tu perfil E-CV</strong><small>Profesional · Compartible</small></div></div><div className="marketing-card__line marketing-card__line--wide" /><div className="marketing-card__line" /><div className="marketing-card__tags"><span>Habilidades</span><span>Proyectos</span><span>CV</span></div><div className="marketing-qr"><QrCode size={46} /><div><strong>Un solo enlace</strong><small>QR listo para compartir</small></div></div></div>
      </section>

      <section id="como-funciona" className="marketing-steps"><div><p className="eyebrow eyebrow--light">Cómo funciona</p><h2>De estudiante a perfil compartible en tres pasos.</h2></div><ol><li><span>01</span><strong>Regístrate</strong><p>Elige tu URL permanente y crea tu cuenta.</p></li><li><span>02</span><strong>Completa tu perfil</strong><p>Guarda borradores hasta que esté listo.</p></li><li><span>03</span><strong>Comparte</strong><p>Publica y comparte tu enlace o QR.</p></li></ol></section>

      {showcase.length > 0 && <section className="marketing-showcase"><div className="marketing-showcase__heading"><div><p className="eyebrow">Perfiles publicados</p><h2>Estudiantes que ya comparten su E-CV.</h2></div><Link className="text-link" href="/registro">Crear el mío <ArrowRight size={15} /></Link></div><div className="showcase-grid">{showcase.map((profile) => <Link className="showcase-card" href={`/${profile.slug}`} key={profile.slug}><span className="showcase-avatar">{profile.avatarAssetId ? <img src={`/api/profile/${encodeURIComponent(profile.slug)}/avatar`} alt="" /> : initials(profile.fullName)}</span><div className="showcase-card__content"><strong>{profile.fullName}</strong><span>{profile.career}</span><small>/{profile.slug}</small></div></Link>)}</div></section>}

      <section className="marketing-features"><article><span><CheckCircle2 size={22} /></span><h2>Contenido que controlas</h2><p>Prepara un borrador privado y publica solo la versión que deseas mostrar.</p></article><article><span><QrCode size={22} /></span><h2>Siempre a la mano</h2><p>Un QR, una vCard y un PDF generados desde tu perfil publicado.</p></article><article><span><ShieldCheck size={22} /></span><h2>Acceso protegido</h2><p>Contraseñas protegidas con bcrypt y JWT HTTP-only con revocación en servidor.</p></article></section>
      <footer className="marketing-footer"><span>Proyecto académico · Nuevas Tecnologías</span><span>E-CV · perfiles digitales para estudiantes</span></footer>
    </main>
  );
}
