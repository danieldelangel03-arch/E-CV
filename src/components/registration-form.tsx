"use client";

import { ArrowRight, AtSign, BriefcaseBusiness, Link2, LockKeyhole, UserRound } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";

import { registerAction, type RegisterState } from "@/app/actions/auth";

const initialState: RegisterState = {};
type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function RegistrationForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const normalizedSlug = useMemo(() => normalizeSlug(slug), [slug]);
  const validSlugFormat = Boolean(normalizedSlug) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug) && normalizedSlug.length >= 3 && normalizedSlug.length <= 80 && normalizedSlug !== "admin";
  const effectiveSlugStatus: SlugStatus = !normalizedSlug ? "idle" : validSlugFormat ? slugStatus : "invalid";

  useEffect(() => {
    if (!validSlugFormat) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSlugStatus("checking");
      try {
        const response = await fetch(`/api/slug/${encodeURIComponent(normalizedSlug)}`, { signal: controller.signal });
        const data = await response.json() as { available?: boolean };
        setSlugStatus(data.available ? "available" : "taken");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setSlugStatus("idle");
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [normalizedSlug, validSlugFormat]);

  const slugMessage = {
    idle: "Usa minúsculas, números y guiones.",
    checking: "Comprobando disponibilidad…",
    available: "Tu URL está disponible.",
    taken: "Esta URL ya está ocupada.",
    invalid: "Usa al menos 3 caracteres: minúsculas, números y guiones.",
  }[effectiveSlugStatus];

  return (
    <form action={action} className="registration-form">
      <label className="field"><span>Nombre completo</span><div className="input-with-icon"><UserRound size={17} /><input name="fullName" autoComplete="name" required placeholder="Tu nombre y apellidos" /></div></label>
      <label className="field"><span>Correo electrónico</span><div className="input-with-icon"><AtSign size={17} /><input name="email" type="email" autoComplete="email" required placeholder="tu.correo@ejemplo.com" /></div></label>
      <label className="field"><span>Carrera o profesión</span><div className="input-with-icon"><BriefcaseBusiness size={17} /><input name="career" required placeholder="Ingeniería en Sistemas" /></div></label>
      <label className="field"><span>Tu URL permanente</span><div className="input-with-icon"><Link2 size={17} /><input name="slug" value={slug} onChange={(event) => { setSlug(event.target.value); setSlugStatus("idle"); }} required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="nombre-apellido" /></div><small className={`slug-hint slug-hint--${effectiveSlugStatus}`}>e-cv.mx/{normalizedSlug || "tu-slug"} · {slugMessage}</small></label>
      <label className="field"><span>Contraseña</span><div className="input-with-icon"><LockKeyhole size={17} /><input name="password" type="password" autoComplete="new-password" minLength={12} required placeholder="Mínimo 12 caracteres" /></div><small>Usa una contraseña que no compartas.</small></label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="button button--primary button--wide" disabled={pending || effectiveSlugStatus === "checking" || effectiveSlugStatus === "taken" || effectiveSlugStatus === "invalid"} type="submit">{pending ? "Creando tu E-CV…" : "Crear mi E-CV gratis"}<ArrowRight size={17} /></button>
    </form>
  );
}
