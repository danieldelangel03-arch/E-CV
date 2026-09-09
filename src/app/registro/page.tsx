import Link from "next/link";
import { BadgeCheck, QrCode, Sparkles } from "lucide-react";

import { RegistrationForm } from "@/components/registration-form";

export const metadata = { title: "Crear mi E-CV | E-CV" };

export default function RegistrationPage() {
  return (
    <main className="auth-page registration-page">
      <section className="auth-aside">
        <Link className="brand brand--light" href="/"><span className="brand-mark">E</span><span>E-CV</span></Link>
        <div><p className="eyebrow eyebrow--light"><Sparkles size={14} /> Tu presencia profesional</p><h1>Tu E-CV empieza con un enlace propio.</h1><p>Crea tu cuenta, completa tu perfil y comparte una tarjeta profesional siempre actualizada.</p></div>
        <div className="auth-aside__benefits"><p><BadgeCheck size={18} /> Tu perfil se crea como borrador privado</p><p><QrCode size={18} /> QR, PDF y vCard cuando decidas publicar</p><p><BadgeCheck size={18} /> El slug será tu URL permanente</p></div>
      </section>
      <section className="auth-panel"><div className="auth-panel__inner"><Link className="back-link" href="/">← Volver al inicio</Link><p className="eyebrow">Registro de estudiante</p><h1>Crea tu E-CV</h1><p className="muted">Tu cuenta queda activa al momento y te llevaremos directo al editor.</p><RegistrationForm /><p className="auth-switch">¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></p></div></section>
    </main>
  );
}
