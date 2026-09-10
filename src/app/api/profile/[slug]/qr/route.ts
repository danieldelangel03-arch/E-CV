import QRCode from "qrcode";

import { getPublicProfile } from "@/lib/profiles";
import { publicOriginFromHeaders, publicProfileUrl } from "@/lib/public-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) return new Response(null, { status: 404 });

  const profileUrl = publicProfileUrl(profile.slug, publicOriginFromHeaders(request.headers) ?? new URL(request.url).origin);
  const png = await QRCode.toBuffer(profileUrl, {
    type: "png",
    width: 700,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#071f38", light: "#ffffff" },
  });
  const bytes = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
