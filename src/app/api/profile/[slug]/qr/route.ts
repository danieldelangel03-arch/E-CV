import QRCode from "qrcode";

import { getPublicProfile } from "@/lib/profiles";
import { publicProfileUrl } from "@/lib/public-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) return new Response(null, { status: 404 });

  const png = await QRCode.toBuffer(publicProfileUrl(profile.slug), {
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
