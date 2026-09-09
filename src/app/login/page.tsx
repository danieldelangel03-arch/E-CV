import Link from "next/link";
import { BadgeCheck, LockKeyhole, QrCode } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { isSafeRelativePath } from "@/lib/validation";

export const metadata = { title: "Iniciar sesión | EProfile" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const nextPath = isSafeRelativePath(next) ? next : undefined;
  return (
    <main className="auth-page"><section className="auth-aside"><Link className="brand brand--light" href="/"><span className="brand-mark">E</span><span>Profile</span></Link><div><p className="eyebrow eyebrow--light">Tu presencia profesional</p><h1>Una tarjeta que avanza contigo.</h1><p>Actualiza tu perfil, guarda borradores y comparte solo la versión publicada.</p></div><div className="auth-aside__benefits"><p><BadgeCheck size={18} /> Borradores aislados del perfil público</p><p><QrCode size={18} /> QR, PDF y vCard desde una sola versión</p><p><LockKeyhole size={18} /> Sesiones protegidas y permisos por rol</p></div></section><section className="auth-panel"><div className="auth-panel__inner"><Link className="back-link" href="/">← Volver al inicio</Link><p className="eyebrow">Acceso seguro</p><h1>Bienvenido de nuevo</h1><p className="muted">Ingresa con las credenciales proporcionadas por la administración de tu plataforma.</p><LoginForm nextPath={nextPath} /></div></section></main>
  );
}
