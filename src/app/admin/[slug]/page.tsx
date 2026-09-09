import Link from "next/link";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import { publishProfileAction, saveProfileDraftAction } from "@/app/actions/profile";
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
  return <main className="dashboard-page"><header className="dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">E</span><span>Profile</span></Link><div className="dashboard-nav__right"><span className="account-label"><ShieldCheck size={15} /> Edición administrativa</span><Link className="button button--secondary button--small" href="/admin"><ArrowLeft size={15} /> Directorio</Link><form action={logoutAction}><button className="icon-button" title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut size={17} /></button></form></div></header><div className="dashboard-shell"><div className="admin-editor-note"><strong>Editando /{profile.slug}</strong><span>{profile.email}</span></div><ProfileEditor key={profile.draftVersionId ?? profile.publishedVersionId ?? "empty"} initialContent={profile.draftContent} saveAction={saveProfileDraftAction.bind(null, profile.slug)} publishAction={publishProfileAction.bind(null, profile.slug)} previewHref={`/${profile.slug}/admin/preview`} avatarUrl={avatarUrl} canPublish={Boolean(profile.draftContent.fullName && profile.draftContent.career)} /></div></main>;
}
