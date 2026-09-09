"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertSameOrigin, requireAdmin } from "@/lib/auth";
import { importBackup } from "@/lib/backup";
import { createStudent, deleteStudent, resetStudentPassword, setStudentActive } from "@/lib/profiles";
import { accountIdSchema, createStudentSchema, passwordSchema } from "@/lib/validation";

function refreshAdmin() {
  revalidatePath("/admin");
}

export async function createStudentAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const parsed = createStudentSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
    slug: formData.get("slug"),
  });
  await createStudent({ ...parsed, email: parsed.email.toLowerCase(), actor });
  refreshAdmin();
  redirect("/admin?notice=created");
}

export async function setStudentActiveAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const userId = accountIdSchema.parse(formData.get("userId"));
  const isActive = formData.get("isActive") === "true";
  await setStudentActive({ userId, isActive, actor });
  refreshAdmin();
  redirect(`/admin?notice=${isActive ? "activated" : "deactivated"}`);
}

export async function resetStudentPasswordAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const userId = accountIdSchema.parse(formData.get("userId"));
  const password = passwordSchema.parse(formData.get("password"));
  await resetStudentPassword({ userId, password, actor });
  refreshAdmin();
  redirect("/admin?notice=password-reset");
}

export async function deleteStudentAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const userId = accountIdSchema.parse(formData.get("userId"));
  await deleteStudent({ userId, actor });
  refreshAdmin();
  redirect("/admin?notice=deleted");
}

export async function importBackupAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const file = formData.get("backup");
  if (!(file instanceof File) || file.size === 0 || file.size > 25 * 1024 * 1024) {
    throw new Error("Selecciona un respaldo JSON de hasta 25 MB.");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error("El archivo de respaldo no es JSON válido.");
  }
  await importBackup(raw, actor);
  refreshAdmin();
  redirect("/admin?notice=backup-imported");
}
