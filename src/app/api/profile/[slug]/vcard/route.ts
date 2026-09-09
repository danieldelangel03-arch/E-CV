import { getPublicProfile } from "@/lib/profiles";
import { publicProfileUrl } from "@/lib/public-url";
import { buildVCard } from "@/lib/vcard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) return new Response(null, { status: 404 });

  return new Response(buildVCard(profile.content, publicProfileUrl(profile.slug)), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${profile.slug}.vcf"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
