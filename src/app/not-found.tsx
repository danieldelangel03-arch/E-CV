import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><Link className="brand" href="/"><span className="brand-mark">E</span><span>Profile</span></Link><p className="eyebrow">404</p><h1>Este perfil no está disponible.</h1><p>Puede no estar publicado, la cuenta estar inactiva o la dirección no existir.</p><Link className="button button--primary" href="/">Ir al inicio</Link></main>;
}
