import "server-only";

import { createHash, randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { and, desc, eq } from "drizzle-orm";

import type { ProfileContent } from "@/lib/content";
import { cloneEmptyContent, hasMeaningfulContent, publicProfileStatus } from "@/lib/content";
import { AuthorizationError, type CurrentUser, revokeAllUserSessions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  auditLogs,
  profileAssets,
  profileCurrent,
  profiles,
  profileVersions,
  sessions,
  users,
} from "@/lib/db/schema";
import { assertPublishable, parseProfileContent } from "@/lib/validation";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type EditableProfile = {
  id: string;
  userId: string;
  email: string;
  slug: string;
  isActive: boolean;
  draftVersionId: string | null;
  publishedVersionId: string | null;
  draftContent: ProfileContent;
  publishedContent: ProfileContent | null;
  status: "empty" | "draft" | "published";
  hasUnpublishedChanges: boolean;
};

export type PublicProfile = {
  id: string;
  slug: string;
  content: ProfileContent;
  publishedAt: Date | null;
};

type ProfileRecord = {
  id: string;
  userId: string;
  slug: string;
  email: string;
  isActive: boolean;
};

function hashContent(content: ProfileContent) {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex");
}

async function getProfileRecord(slug: string): Promise<ProfileRecord | null> {
  const [profile] = await getDb()
    .select({
      id: profiles.id,
      userId: profiles.userId,
      slug: profiles.slug,
      email: users.email,
      isActive: users.isActive,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.slug, slug))
    .limit(1);

  return profile ?? null;
}

function assertCanEdit(actor: CurrentUser, profile: ProfileRecord) {
  if (actor.role === "admin" || actor.id === profile.userId) return;
  throw new AuthorizationError("No puedes acceder al perfil de otro estudiante.");
}

async function getPointers(profileId: string) {
  const [pointers] = await getDb()
    .select()
    .from(profileCurrent)
    .where(eq(profileCurrent.profileId, profileId))
    .limit(1);
  return pointers ?? null;
}

async function getVersion(versionId: string | null) {
  if (!versionId) return null;
  const [version] = await getDb()
    .select()
    .from(profileVersions)
    .where(eq(profileVersions.id, versionId))
    .limit(1);
  return version ?? null;
}

export async function getEditableProfileBySlug(
  slug: string,
  actor: CurrentUser,
): Promise<EditableProfile | null> {
  const profile = await getProfileRecord(slug);
  if (!profile) return null;
  assertCanEdit(actor, profile);

  const pointers = await getPointers(profile.id);
  const [draft, published] = await Promise.all([
    getVersion(pointers?.draftVersionId ?? null),
    getVersion(pointers?.publishedVersionId ?? null),
  ]);
  const draftContent = draft?.content ?? published?.content ?? cloneEmptyContent();
  const publishedContent = published?.content ?? null;

  return {
    id: profile.id,
    userId: profile.userId,
    email: profile.email,
    slug: profile.slug,
    isActive: profile.isActive,
    draftVersionId: pointers?.draftVersionId ?? null,
    publishedVersionId: pointers?.publishedVersionId ?? null,
    draftContent,
    publishedContent,
    status: publicProfileStatus({
      draftVersionId: pointers?.draftVersionId ?? null,
      publishedVersionId: pointers?.publishedVersionId ?? null,
      draftContent,
    }),
    hasUnpublishedChanges: draft && published
      ? hashContent(draft.content) !== hashContent(published.content)
      : false,
  };
}

export async function getPublicProfile(slug: string): Promise<PublicProfile | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  const [result] = await getDb()
    .select({
      id: profiles.id,
      slug: profiles.slug,
      content: profileVersions.content,
      publishedAt: profileVersions.publishedAt,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .innerJoin(profileCurrent, eq(profileCurrent.profileId, profiles.id))
    .innerJoin(profileVersions, eq(profileVersions.id, profileCurrent.publishedVersionId))
    .where(
      and(
        eq(profiles.slug, normalizedSlug),
        eq(users.isActive, true),
        eq(profileVersions.kind, "published"),
      ),
    )
    .limit(1);

  return result ?? null;
}

async function saveAudit(input: {
  actorUserId: string | null;
  action: string;
  subjectEmail?: string | null;
  subjectSlug?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await getDb().insert(auditLogs).values({
    id: randomUUID(),
    actorUserId: input.actorUserId,
    action: input.action,
    subjectEmail: input.subjectEmail ?? null,
    subjectSlug: input.subjectSlug ?? null,
    metadata: input.metadata,
  });
}

function isUpload(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "arrayBuffer" in value &&
      "size" in value &&
      "type" in value,
  );
}

export async function saveDraft(input: {
  slug: string;
  actor: CurrentUser;
  content: ProfileContent;
  photo: FormDataEntryValue | null;
  removeAvatar: boolean;
}) {
  const profile = await getProfileRecord(input.slug);
  if (!profile) throw new Error("Perfil no encontrado.");
  assertCanEdit(input.actor, profile);

  const uploaded = isUpload(input.photo) && input.photo.size > 0 ? input.photo : null;
  if (uploaded && (!IMAGE_TYPES.has(uploaded.type) || uploaded.size > MAX_AVATAR_BYTES)) {
    throw new Error("La foto debe ser JPG, PNG o WebP y pesar menos de 2 MB.");
  }

  await getDb().transaction(async (tx) => {
    let content = parseProfileContent(input.content);
    if (input.removeAvatar) content = { ...content, avatarAssetId: null };

    if (uploaded) {
      const bytes = Buffer.from(await uploaded.arrayBuffer());
      const assetId = randomUUID();
      await tx.insert(profileAssets).values({
        id: assetId,
        profileId: profile.id,
        contentType: uploaded.type,
        byteSize: bytes.byteLength,
        contentHash: createHash("sha256").update(bytes).digest("hex"),
        bytes,
      });
      content = { ...content, avatarAssetId: assetId };
    }

    if (content.avatarAssetId) {
      const [asset] = await tx
        .select({ id: profileAssets.id })
        .from(profileAssets)
        .where(and(eq(profileAssets.id, content.avatarAssetId), eq(profileAssets.profileId, profile.id)))
        .limit(1);
      if (!asset) throw new AuthorizationError("La fotografía no pertenece a este perfil.");
    }

    const [current] = await tx
      .select()
      .from(profileCurrent)
      .where(eq(profileCurrent.profileId, profile.id))
      .limit(1);
    const [latest] = await tx
      .select({ sequence: profileVersions.sequence })
      .from(profileVersions)
      .where(eq(profileVersions.profileId, profile.id))
      .orderBy(desc(profileVersions.sequence))
      .limit(1);

    const draftId = randomUUID();
    await tx.insert(profileVersions).values({
      id: draftId,
      profileId: profile.id,
      sequence: (latest?.sequence ?? 0) + 1,
      kind: "draft",
      content,
      contentHash: hashContent(content),
      sourceVersionId: current?.draftVersionId ?? current?.publishedVersionId ?? null,
      createdBy: input.actor.id,
    });

    if (current) {
      await tx
        .update(profileCurrent)
        .set({ draftVersionId: draftId, updatedAt: new Date() })
        .where(eq(profileCurrent.profileId, profile.id));
    } else {
      await tx.insert(profileCurrent).values({ profileId: profile.id, draftVersionId: draftId });
    }

    await tx.update(profiles).set({ updatedAt: new Date() }).where(eq(profiles.id, profile.id));
  });

  await saveAudit({
    actorUserId: input.actor.id,
    action: "profile.draft_saved",
    subjectEmail: profile.email,
    subjectSlug: profile.slug,
  });
}

export async function publishProfile(input: { slug: string; actor: CurrentUser }) {
  const profile = await getProfileRecord(input.slug);
  if (!profile) throw new Error("Perfil no encontrado.");
  assertCanEdit(input.actor, profile);

  await getDb().transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(profileCurrent)
      .where(eq(profileCurrent.profileId, profile.id))
      .limit(1);
    if (!current?.draftVersionId) throw new Error("Guarda un borrador antes de publicar.");

    const [draft] = await tx
      .select()
      .from(profileVersions)
      .where(and(eq(profileVersions.id, current.draftVersionId), eq(profileVersions.profileId, profile.id)))
      .limit(1);
    if (!draft || draft.kind !== "draft") throw new Error("El borrador actual no es válido.");

    const content = parseProfileContent(draft.content);
    assertPublishable(content);

    const [latest] = await tx
      .select({ sequence: profileVersions.sequence })
      .from(profileVersions)
      .where(eq(profileVersions.profileId, profile.id))
      .orderBy(desc(profileVersions.sequence))
      .limit(1);
    const publishedId = randomUUID();
    await tx.insert(profileVersions).values({
      id: publishedId,
      profileId: profile.id,
      sequence: (latest?.sequence ?? 0) + 1,
      kind: "published",
      content,
      contentHash: hashContent(content),
      sourceVersionId: draft.id,
      createdBy: input.actor.id,
      publishedAt: new Date(),
    });

    await tx
      .update(profileCurrent)
      .set({ publishedVersionId: publishedId, updatedAt: new Date() })
      .where(eq(profileCurrent.profileId, profile.id));
    await tx.update(profiles).set({ updatedAt: new Date() }).where(eq(profiles.id, profile.id));
  });

  await saveAudit({
    actorUserId: input.actor.id,
    action: "profile.published",
    subjectEmail: profile.email,
    subjectSlug: profile.slug,
  });
}

export async function getPublicAsset(slug: string) {
  const profile = await getPublicProfile(slug);
  if (!profile?.content.avatarAssetId) return null;

  const [asset] = await getDb()
    .select({ contentType: profileAssets.contentType, bytes: profileAssets.bytes })
    .from(profileAssets)
    .where(
      and(eq(profileAssets.id, profile.content.avatarAssetId), eq(profileAssets.profileId, profile.id)),
    )
    .limit(1);
  return asset ?? null;
}

export async function getPrivateAsset(assetId: string, actor: CurrentUser) {
  const [asset] = await getDb()
    .select({
      id: profileAssets.id,
      profileId: profileAssets.profileId,
      contentType: profileAssets.contentType,
      bytes: profileAssets.bytes,
      userId: profiles.userId,
    })
    .from(profileAssets)
    .innerJoin(profiles, eq(profileAssets.profileId, profiles.id))
    .where(eq(profileAssets.id, assetId))
    .limit(1);
  if (!asset || (actor.role !== "admin" && actor.id !== asset.userId)) return null;
  return asset;
}

export type AdminProfileSummary = {
  id: string;
  userId: string;
  slug: string;
  email: string;
  isActive: boolean;
  status: "empty" | "draft" | "published";
  hasUnpublishedChanges: boolean;
};

export async function listAdminProfiles(): Promise<AdminProfileSummary[]> {
  const rows = await getDb()
    .select({
      id: profiles.id,
      userId: profiles.userId,
      slug: profiles.slug,
      email: users.email,
      isActive: users.isActive,
      draftVersionId: profileCurrent.draftVersionId,
      publishedVersionId: profileCurrent.publishedVersionId,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .leftJoin(profileCurrent, eq(profileCurrent.profileId, profiles.id))
    .orderBy(users.email);

  return Promise.all(
    rows.map(async (row) => {
      const [draft, published] = await Promise.all([
        getVersion(row.draftVersionId),
        getVersion(row.publishedVersionId),
      ]);
      return {
        id: row.id,
        userId: row.userId,
        slug: row.slug,
        email: row.email,
        isActive: row.isActive,
        status: publicProfileStatus({
          draftVersionId: row.draftVersionId,
          publishedVersionId: row.publishedVersionId,
          draftContent: draft?.content,
        }),
        hasUnpublishedChanges: draft && published
          ? hashContent(draft.content) !== hashContent(published.content)
          : false,
      };
    }),
  );
}

export async function createStudent(input: {
  email: string;
  password: string;
  slug: string;
  actor: CurrentUser;
}) {
  if (input.actor.role !== "admin") throw new AuthorizationError();
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 12);

  await getDb().transaction(async (tx) => {
    const userId = randomUUID();
    const profileId = randomUUID();
    await tx.insert(users).values({
      id: userId,
      email,
      passwordHash,
      role: "student",
      isActive: true,
    });
    await tx.insert(profiles).values({ id: profileId, userId, slug: input.slug });
    await tx.insert(profileCurrent).values({ profileId, draftVersionId: null, publishedVersionId: null });
  });

  await saveAudit({
    actorUserId: input.actor.id,
    action: "student.created",
    subjectEmail: email,
    subjectSlug: input.slug,
  });
}

async function getStudentById(userId: string) {
  const [student] = await getDb()
    .select({ id: users.id, email: users.email, role: users.role, slug: profiles.slug })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (!student || student.role !== "student") throw new Error("La cuenta de estudiante no existe.");
  return student;
}

export async function setStudentActive(input: {
  userId: string;
  isActive: boolean;
  actor: CurrentUser;
}) {
  if (input.actor.role !== "admin") throw new AuthorizationError();
  const student = await getStudentById(input.userId);
  await getDb()
    .update(users)
    .set({ isActive: input.isActive, updatedAt: new Date() })
    .where(eq(users.id, student.id));
  if (!input.isActive) await revokeAllUserSessions(student.id);
  await saveAudit({
    actorUserId: input.actor.id,
    action: input.isActive ? "student.activated" : "student.deactivated",
    subjectEmail: student.email,
    subjectSlug: student.slug,
  });
}

export async function resetStudentPassword(input: {
  userId: string;
  password: string;
  actor: CurrentUser;
}) {
  if (input.actor.role !== "admin") throw new AuthorizationError();
  const student = await getStudentById(input.userId);
  await getDb()
    .update(users)
    .set({ passwordHash: await bcrypt.hash(input.password, 12), updatedAt: new Date() })
    .where(eq(users.id, student.id));
  await revokeAllUserSessions(student.id);
  await saveAudit({
    actorUserId: input.actor.id,
    action: "student.password_reset",
    subjectEmail: student.email,
    subjectSlug: student.slug,
  });
}

export async function deleteStudent(input: { userId: string; actor: CurrentUser }) {
  if (input.actor.role !== "admin") throw new AuthorizationError();
  const student = await getStudentById(input.userId);

  await getDb().transaction(async (tx) => {
    await tx.delete(sessions).where(eq(sessions.userId, student.id));
    await tx.delete(users).where(eq(users.id, student.id));
  });
  await saveAudit({
    actorUserId: input.actor.id,
    action: "student.deleted",
    subjectEmail: student.email,
    subjectSlug: student.slug,
  });
}

export async function getBackupData() {
  const db = getDb();
  const userRows = await db
    .select({ id: users.id, email: users.email, role: users.role, isActive: users.isActive, passwordHash: users.passwordHash })
    .from(users)
    .orderBy(users.email);
  const profileRows = await db.select().from(profiles).orderBy(profiles.slug);
  const assetRows = await db
    .select({
      id: profileAssets.id,
      profileSlug: profiles.slug,
      contentType: profileAssets.contentType,
      byteSize: profileAssets.byteSize,
      contentHash: profileAssets.contentHash,
      bytes: profileAssets.bytes,
    })
    .from(profileAssets)
    .innerJoin(profiles, eq(profileAssets.profileId, profiles.id));

  const profilesData = await Promise.all(
    profileRows.map(async (profile) => {
      const pointers = await getPointers(profile.id);
      const [draft, published] = await Promise.all([
        getVersion(pointers?.draftVersionId ?? null),
        getVersion(pointers?.publishedVersionId ?? null),
      ]);
      return {
        slug: profile.slug,
        userEmail: userRows.find((user) => user.id === profile.userId)?.email ?? "",
        draft: draft?.content ?? null,
        published: published?.content ?? null,
        publishedAt: published?.publishedAt?.toISOString() ?? null,
      };
    }),
  );

  return {
    format: "eprofile-backup",
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    users: userRows.map((user) => ({
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      passwordHash: user.passwordHash,
    })),
    profiles: profilesData,
    assets: assetRows.map((asset) => ({
      id: asset.id,
      profileSlug: asset.profileSlug,
      contentType: asset.contentType,
      byteSize: asset.byteSize,
      contentHash: asset.contentHash,
      bytesBase64: Buffer.from(asset.bytes).toString("base64"),
    })),
  };
}

export function backupHasMeaningfulDraft(content: ProfileContent | null) {
  return Boolean(content && hasMeaningfulContent(content));
}
