import { assertSameOrigin, requireAdmin } from "@/lib/auth";
import { importBackup } from "@/lib/backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  let raw: unknown;
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      raw = await request.json();
    } else {
      const formData = await request.formData();
      const file = formData.get("backup");
      if (!(file instanceof File) || file.size === 0 || file.size > 25 * 1024 * 1024) {
        return Response.json({ error: "Se requiere un respaldo JSON de hasta 25 MB." }, { status: 400 });
      }
      raw = JSON.parse(await file.text());
    }
  } catch {
    return Response.json({ error: "El respaldo no es JSON válido." }, { status: 400 });
  }

  try {
    await importBackup(raw, actor);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo importar el respaldo.";
    return Response.json({ error: message }, { status: 400 });
  }
}
