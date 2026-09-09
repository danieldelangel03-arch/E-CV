import { createCvPdf } from "@/lib/pdf";
import { getPublicProfile } from "@/lib/profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) return new Response(null, { status: 404 });

  const requestedTemplate = new URL(request.url).searchParams.get("template");
  const template = requestedTemplate === "modern" || requestedTemplate === "classic"
    ? requestedTemplate
    : profile.content.pdfTemplate;
  const bytes = await createCvPdf(profile.content, template);

  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${profile.slug}-cv.pdf"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
