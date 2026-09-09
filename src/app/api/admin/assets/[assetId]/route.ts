import { getCurrentUser } from "@/lib/auth";
import { getPrivateAsset } from "@/lib/profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });

  const { assetId } = await params;
  const asset = await getPrivateAsset(assetId, user);
  if (!asset) return new Response(null, { status: 404 });

  const bytes = asset.bytes.buffer.slice(
    asset.bytes.byteOffset,
    asset.bytes.byteOffset + asset.bytes.byteLength,
  ) as ArrayBuffer;
  return new Response(bytes, {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
