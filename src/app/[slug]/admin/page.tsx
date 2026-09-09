import { notFound, redirect } from "next/navigation";

import { publishProfileAction, saveProfileDraftAction } from "@/app/actions/profile";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { ProfileEditor } from "@/components/profile-editor";
import { AuthorizationError, getCurrentUser } from "@/lib/auth";
import { getEditableProfileBySlug } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actor = await getCurrentUser();
  if (!actor) redirect(`/login?next=/${encodeURIComponent(slug)}/admin`);

  let profile;
  try {
    profile = await getEditableProfileBySlug(slug, actor);
  } catch (error) {
    if (error instanceof AuthorizationError) redirect(actor.role === "admin" ? "/admin" : "/");
    throw error;
  }
  if (!profile) notFound();

  const avatarUrl = profile.draftContent.avatarAssetId ? `/api/admin/assets/${profile.draftContent.avatarAssetId}` : null;
  const canPublish = Boolean(profile.draftContent.fullName && profile.draftContent.career);
  return <main className="dashboard-page"><DashboardSidebar role={actor.role} slug={profile.slug} editingAsAdmin={actor.role === "admin"} /><div className="dashboard-main"><div className="dashboard-shell"><ProfileEditor key={profile.draftVersionId ?? profile.publishedVersionId ?? "empty"} initialContent={profile.draftContent} saveAction={saveProfileDraftAction.bind(null, profile.slug)} publishAction={publishProfileAction.bind(null, profile.slug)} previewHref={`/${profile.slug}/admin/preview`} avatarUrl={avatarUrl} canPublish={canPublish} /></div></div></main>;
}
