import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { ProfileContent } from "@/lib/content";
import type { CurrentUser } from "@/lib/auth";
import { AuthorizationError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { auditLogs, profileAssets, profileCurrent, profiles, profileVersions, users } from "@/lib/db/schema";
import { assertPublishable, profileContentSchema, slugSchema } from "@/lib/validation";

const backupUserSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  role: z.enum(["admin", "student"]),
  isActive: z.boolean(),
  // Es un hash bcrypt, nunca una contraseña en claro. El archivo sigue siendo sensible.
  passwordHash: z.string().min(20).max(200),
});

const backupProfileSchema = z.object({
  slug: slugSchema,
  userEmail: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  draft: profileContentSchema.nullable(),
  published: profileContentSchema.nullable(),
  publishedAt: z.string().datetime().nullable(),
});

const backupAssetSchema = z.object({
  id: z.string().uuid(),
  profileSlug: slugSchema,
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  byteSize: z.number().int().positive().max(2 * 1024 * 1024),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  bytesBase64: z.string().min(4).max(2_800_000),
});

export const backupSchema = z.object({
  format: z.literal("eprofile-backup"),
  schemaVersion: z.literal(1),
  createdAt: z.string().datetime(),
  users: z.array(backupUserSchema).max(1_000),
  profiles: z.array(backupProfileSchema).max(1_000),
  assets: z.array(backupAssetSchema).max(100).default([]),
});

type ValidBackup = z.infer<typeof backupSchema>;

function contentHash(content: ProfileContent) {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex");
}

function unique(values: string[], label: string) {
  if (new Set(values).size !== values.length) throw new Error(`El respaldo contiene ${label} duplicados.`);
}

function decodeAsset(input: ValidBackup["assets"][number]) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(input.bytesBase64)) {
    throw new Error("Una imagen del respaldo no está codificada correctamente.");
  }
  const bytes = Buffer.from(input.bytesBase64, "base64");
  if (bytes.byteLength !== input.byteSize || createHash("sha256").update(bytes).digest("hex") !== input.contentHash) {
    throw new Error("La integridad de una imagen del respaldo no es válida.");
  }
  return bytes;
}

function rewriteAvatar(content: ProfileContent | null, assetIds: Map<string, string>): ProfileContent | null {
  if (!content) return null;
  const avatarAssetId = content.avatarAssetId ? assetIds.get(content.avatarAssetId) : null;
  if (content.avatarAssetId && !avatarAssetId) {
    throw new Error("El respaldo referencia una fotografía que no fue incluida.");
  }
  return { ...content, avatarAssetId: avatarAssetId ?? null };
}

export async function importBackup(raw: unknown, actor: CurrentUser) {
  if (actor.role !== "admin") throw new AuthorizationError();
  const backup = backupSchema.parse(raw);
  unique(backup.users.map((user) => user.email), "correos");
  unique(backup.profiles.map((profile) => profile.slug), "slugs");
  unique(backup.profiles.map((profile) => profile.userEmail), "perfiles por usuario");
  unique(backup.assets.map((asset) => asset.id), "recursos");

  const userEmails = new Set(backup.users.map((user) => user.email));
  backup.profiles.forEach((profile) => {
    if (!userEmails.has(profile.userEmail)) throw new Error(`El perfil ${profile.slug} no tiene una cuenta asociada.`);
    if (profile.published) assertPublishable(profile.published);
  });
  const profileSlugs = new Set(backup.profiles.map((profile) => profile.slug));
  backup.assets.forEach((asset) => {
    if (!profileSlugs.has(asset.profileSlug)) throw new Error("El respaldo contiene una imagen sin perfil asociado.");
    decodeAsset(asset);
  });

  const db = getDb();
  await db.transaction(async (tx) => {
    const userIds = new Map<string, string>();
    for (const backupUser of backup.users) {
      const [existing] = await tx
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.email, backupUser.email))
        .limit(1);
      const userId = existing?.id ?? randomUUID();
      if (existing) {
        await tx
          .update(users)
          .set({
            role: backupUser.role,
            isActive: backupUser.isActive,
            passwordHash: backupUser.passwordHash,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      } else {
        await tx.insert(users).values({
          id: userId,
          email: backupUser.email,
          role: backupUser.role,
          isActive: backupUser.isActive,
          passwordHash: backupUser.passwordHash,
        });
      }
      userIds.set(backupUser.email, userId);
    }

    for (const backupProfile of backup.profiles) {
      const userId = userIds.get(backupProfile.userEmail);
      if (!userId) throw new Error("No fue posible relacionar una cuenta importada.");

      const [bySlug] = await tx
        .select({ id: profiles.id, userId: profiles.userId })
        .from(profiles)
        .where(eq(profiles.slug, backupProfile.slug))
        .limit(1);
      const [byUser] = await tx
        .select({ id: profiles.id, slug: profiles.slug })
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);
      if (bySlug && bySlug.userId !== userId) {
        throw new Error(`El slug ${backupProfile.slug} ya pertenece a otra cuenta.`);
      }
      if (byUser && byUser.slug !== backupProfile.slug) {
        throw new Error(`La cuenta ${backupProfile.userEmail} ya tiene un slug permanente diferente.`);
      }

      const profileId = bySlug?.id ?? byUser?.id ?? randomUUID();
      if (!bySlug && !byUser) {
        await tx.insert(profiles).values({ id: profileId, userId, slug: backupProfile.slug });
      }

      const assetsForProfile = backup.assets.filter((asset) => asset.profileSlug === backupProfile.slug);
      const assetIds = new Map<string, string>();
      for (const asset of assetsForProfile) {
        const id = randomUUID();
        assetIds.set(asset.id, id);
        await tx.insert(profileAssets).values({
          id,
          profileId,
          contentType: asset.contentType,
          byteSize: asset.byteSize,
          contentHash: asset.contentHash,
          bytes: decodeAsset(asset),
        });
      }

      const draftContent = rewriteAvatar(backupProfile.draft, assetIds);
      const publishedContent = rewriteAvatar(backupProfile.published, assetIds);
      const [latest] = await tx
        .select({ sequence: profileVersions.sequence })
        .from(profileVersions)
        .where(eq(profileVersions.profileId, profileId))
        .orderBy(desc(profileVersions.sequence))
        .limit(1);
      let sequence = latest?.sequence ?? 0;
      const publishedId = publishedContent ? randomUUID() : null;
      if (publishedContent && publishedId) {
        sequence += 1;
        await tx.insert(profileVersions).values({
          id: publishedId,
          profileId,
          sequence,
          kind: "published",
          content: publishedContent,
          contentHash: contentHash(publishedContent),
          sourceVersionId: null,
          createdBy: actor.id,
          publishedAt: backupProfile.publishedAt ? new Date(backupProfile.publishedAt) : new Date(),
        });
      }
      const draftId = draftContent ? randomUUID() : null;
      if (draftContent && draftId) {
        sequence += 1;
        await tx.insert(profileVersions).values({
          id: draftId,
          profileId,
          sequence,
          kind: "draft",
          content: draftContent,
          contentHash: contentHash(draftContent),
          sourceVersionId: publishedId,
          createdBy: actor.id,
        });
      }

      const [current] = await tx
        .select({ profileId: profileCurrent.profileId })
        .from(profileCurrent)
        .where(eq(profileCurrent.profileId, profileId))
        .limit(1);
      if (current) {
        await tx
          .update(profileCurrent)
          .set({ draftVersionId: draftId, publishedVersionId: publishedId, updatedAt: new Date() })
          .where(eq(profileCurrent.profileId, profileId));
      } else {
        await tx.insert(profileCurrent).values({ profileId, draftVersionId: draftId, publishedVersionId: publishedId });
      }
    }
  });

  await db.insert(auditLogs).values({
    id: randomUUID(),
    actorUserId: actor.id,
    action: "backup.imported",
    metadata: {
      users: backup.users.length,
      profiles: backup.profiles.length,
      assets: backup.assets.length,
      createdAt: backup.createdAt,
    },
  });
}
