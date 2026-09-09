import { notFound } from "next/navigation";

import { ProfileView } from "@/components/profile-view";
import { getPublicProfile } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!process.env.DATABASE_URL) notFound();
  const profile = await getPublicProfile(slug);
  if (!profile) notFound();
  const avatarUrl = profile.content.avatarAssetId ? `/api/profile/${encodeURIComponent(profile.slug)}/avatar` : null;
  return <ProfileView slug={profile.slug} content={profile.content} avatarUrl={avatarUrl} />;
}
