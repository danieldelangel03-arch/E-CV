import { getPublicAsset } from "@/lib/profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const asset = await getPublicAsset(slug);
  if (!asset) return new Response(null, { status: 404 });

  const bytes = asset.bytes.buffer.slice(
    asset.bytes.byteOffset,
    asset.bytes.byteOffset + asset.bytes.byteLength,
  ) as ArrayBuffer;
  return new Response(bytes, {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
