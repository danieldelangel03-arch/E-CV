"use client";

import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="login-form">
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      <label className="field"><span>Correo electrónico</span><div className="input-with-icon"><Mail size={17} /><input name="email" type="email" autoComplete="email" required placeholder="tu.correo@ejemplo.com" /></div></label>
      <label className="field"><span>Contraseña</span><div className="input-with-icon"><LockKeyhole size={17} /><input name="password" type="password" autoComplete="current-password" required placeholder="••••••••••••" /></div></label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="button button--primary button--wide" disabled={pending} type="submit">{pending ? "Verificando…" : "Entrar a EProfile"}<ArrowRight size={17} /></button>
    </form>
  );
}
