import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { ProfileView } from "@/components/profile-view";
import { publicOriginFromHeaders, publicProfileUrl } from "@/lib/public-url";
import { getPublicProfile } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!process.env.DATABASE_URL) notFound();
  const profile = await getPublicProfile(slug);
  if (!profile) notFound();
  const avatarUrl = profile.content.avatarAssetId ? `/api/profile/${encodeURIComponent(profile.slug)}/avatar` : null;
  const requestOrigin = publicOriginFromHeaders(await headers());
  return <ProfileView slug={profile.slug} content={profile.content} avatarUrl={avatarUrl} profileUrl={publicProfileUrl(profile.slug, requestOrigin)} />;
}
