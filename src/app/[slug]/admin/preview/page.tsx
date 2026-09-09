import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ProfileView } from "@/components/profile-view";
import { AuthorizationError, getCurrentUser } from "@/lib/auth";
import { getEditableProfileBySlug } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function DraftPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actor = await getCurrentUser();
  if (!actor) redirect(`/login?next=/${encodeURIComponent(slug)}/admin/preview`);
  let profile;
  try {
    profile = await getEditableProfileBySlug(slug, actor);
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/");
    throw error;
  }
  if (!profile) notFound();
  const avatarUrl = profile.draftContent.avatarAssetId ? `/api/admin/assets/${profile.draftContent.avatarAssetId}` : null;
  return <><Link href={`/${profile.slug}/admin`} className="preview-back"><ArrowLeft size={16} /> Volver al editor</Link><ProfileView slug={profile.slug} content={profile.draftContent} preview avatarUrl={avatarUrl} /></>;
}
