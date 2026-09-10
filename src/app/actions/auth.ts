"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { assertSameOrigin, createSession, revokeCurrentSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { AccountConflictError, registerStudent } from "@/lib/profiles";
import { isSafeRelativePath, loginSchema, registerStudentSchema } from "@/lib/validation";

export type LoginState = { error?: string };
export type RegisterState = { error?: string };

export async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  let destination = "/";

  try {
    await assertSameOrigin();
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      next: formData.get("next") || undefined,
    });
    if (!parsed.success) return { error: "Revisa el correo y la contraseña." };

    const email = parsed.data.email.toLowerCase();
    const [account] = await getDb()
      .select({ id: users.id, passwordHash: users.passwordHash, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const matches = account ? await bcrypt.compare(parsed.data.password, account.passwordHash) : false;
    if (!account || !account.isActive || !matches) {
      return { error: "Correo o contraseña inválidos." };
    }

    destination = isSafeRelativePath(parsed.data.next) ? parsed.data.next : "/";
    if (!isSafeRelativePath(parsed.data.next)) {
      if (account.role === "admin") {
        destination = "/admin";
      } else {
        const [profile] = await getDb()
          .select({ slug: profiles.slug })
          .from(profiles)
          .where(eq(profiles.userId, account.id))
          .limit(1);
        destination = profile ? `/${profile.slug}/admin` : "/";
      }
    }

    await createSession(account.id);
  } catch (error) {
    const details = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { error };
    console.error("[auth.login] Error inesperado al iniciar sesión", details);
    return { error: "No fue posible iniciar sesión. Intenta de nuevo en unos minutos." };
  }

  redirect(destination);
}

export async function logoutAction() {
  await assertSameOrigin();
  await revokeCurrentSession();
  redirect("/");
}

export async function registerAction(_previousState: RegisterState, formData: FormData): Promise<RegisterState> {
  await assertSameOrigin();
  const parsed = registerStudentSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    career: formData.get("career"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) return { error: "Revisa los datos: usa un correo vÃ¡lido, slug vÃ¡lido y contraseÃ±a de 12 caracteres." };

  try {
    const account = await registerStudent({ ...parsed.data, email: parsed.data.email.toLowerCase() });
    await createSession(account.userId);
    redirect(`/${account.slug}/admin`);
  } catch (error) {
    if (error instanceof AccountConflictError) return { error: error.message };
    throw error;
  }
}
