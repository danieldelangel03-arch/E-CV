import { notFound, redirect } from "next/navigation";

import { publishProfileAction, saveProfileDraftAction } from "@/app/actions/profile";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { ProfileEditor } from "@/components/profile-editor";
import { getCurrentUser } from "@/lib/auth";
import { getEditableProfileBySlug } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function AdminProfileEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actor = await getCurrentUser();
  if (!actor) redirect(`/login?next=/admin/${encodeURIComponent(slug)}`);
  if (actor.role !== "admin") redirect("/");
  const profile = await getEditableProfileBySlug(slug, actor);
  if (!profile) notFound();
  const avatarUrl = profile.draftContent.avatarAssetId ? `/api/admin/assets/${profile.draftContent.avatarAssetId}` : null;
  return <main className="dashboard-page"><DashboardSidebar role="admin" slug={profile.slug} editingAsAdmin /><div className="dashboard-main"><div className="dashboard-shell"><div className="admin-editor-note"><strong>Editando /{profile.slug}</strong><span>{profile.email} · origen {profile.origin === "auto" ? "auto-registro" : "manual"}</span></div><ProfileEditor key={profile.draftVersionId ?? profile.publishedVersionId ?? "empty"} initialContent={profile.draftContent} saveAction={saveProfileDraftAction.bind(null, profile.slug)} publishAction={publishProfileAction.bind(null, profile.slug)} previewHref={`/${profile.slug}/admin/preview`} avatarUrl={avatarUrl} canPublish={Boolean(profile.draftContent.fullName && profile.draftContent.career)} /></div></div></main>;
}
