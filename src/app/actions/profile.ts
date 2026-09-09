"use server";

import { revalidatePath } from "next/cache";

import { assertSameOrigin, requireActiveUser } from "@/lib/auth";
import { publishProfile, saveDraft } from "@/lib/profiles";
import { parseProfileContentJson } from "@/lib/validation";

async function profilePayload(slug: string, formData: FormData) {
  const actor = await requireActiveUser();
  return {
    slug,
    actor,
    content: parseProfileContentJson(formData.get("content")),
    photo: formData.get("photo"),
    removeAvatar: formData.get("removeAvatar") === "on",
  };
}

function refreshProfilePaths(slug: string) {
  revalidatePath(`/${slug}/admin`);
  revalidatePath(`/${slug}/admin/preview`);
  revalidatePath(`/${slug}`);
  revalidatePath("/admin");
}

export async function saveProfileDraftAction(slug: string, formData: FormData) {
  await assertSameOrigin();
  await saveDraft(await profilePayload(slug, formData));
  refreshProfilePaths(slug);
}

export async function publishProfileAction(slug: string, formData: FormData) {
  await assertSameOrigin();
  const payload = await profilePayload(slug, formData);
  await saveDraft(payload);
  await publishProfile({ slug, actor: payload.actor });
  refreshProfilePaths(slug);
}
