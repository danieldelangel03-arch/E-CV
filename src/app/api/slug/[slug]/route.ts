import { isSlugAvailable } from "@/lib/profiles";
import { slugSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return Response.json({ available: false, reason: "invalid" }, { status: 400 });

  return Response.json({ available: await isSlugAvailable(parsed.data) });
}
