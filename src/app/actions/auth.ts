"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { assertSameOrigin, createSession, revokeCurrentSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { isSafeRelativePath, loginSchema } from "@/lib/validation";

export type LoginState = { error?: string };

export async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
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

  await createSession(account.id);
  if (isSafeRelativePath(parsed.data.next)) redirect(parsed.data.next);

  if (account.role === "admin") redirect("/admin");
  const [profile] = await getDb()
    .select({ slug: profiles.slug })
    .from(profiles)
    .where(eq(profiles.userId, account.id))
    .limit(1);
  redirect(profile ? `/${profile.slug}/admin` : "/");
}

export async function logoutAction() {
  await assertSameOrigin();
  await revokeCurrentSession();
  redirect("/");
}
