import { getPublicProfile } from "@/lib/profiles";
import { publicOriginFromHeaders, publicProfileUrl } from "@/lib/public-url";
import { buildVCard } from "@/lib/vcard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) return new Response(null, { status: 404 });

  const profileUrl = publicProfileUrl(profile.slug, publicOriginFromHeaders(request.headers) ?? new URL(request.url).origin);
  return new Response(buildVCard(profile.content, profileUrl), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${profile.slug}.vcf"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
