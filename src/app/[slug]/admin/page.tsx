import Link from "next/link";
import { LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import { publishProfileAction, saveProfileDraftAction } from "@/app/actions/profile";
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

  const avatarUrl = profile.draftContent.avatarAssetId
    ? `/api/admin/assets/${profile.draftContent.avatarAssetId}`
    : null;
  const canPublish = Boolean(profile.draftContent.fullName && profile.draftContent.career);

  return <main className="dashboard-page"><header className="dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">E</span><span>Profile</span></Link><div className="dashboard-nav__right"><span className="account-label"><ShieldCheck size={15} /> {actor.role === "admin" ? "Administrador" : "Estudiante"}</span>{actor.role === "admin" && <Link className="button button--secondary button--small" href="/admin"><LayoutDashboard size={15} /> Administración</Link>}<Link className="button button--secondary button--small" href={`/${profile.slug}`}>Ver público</Link><form action={logoutAction}><button className="icon-button" title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut size={17} /></button></form></div></header><div className="dashboard-shell"><ProfileEditor key={profile.draftVersionId ?? profile.publishedVersionId ?? "empty"} initialContent={profile.draftContent} saveAction={saveProfileDraftAction.bind(null, profile.slug)} publishAction={publishProfileAction.bind(null, profile.slug)} previewHref={`/${profile.slug}/admin/preview`} avatarUrl={avatarUrl} canPublish={canPublish} /></div></main>;
}
