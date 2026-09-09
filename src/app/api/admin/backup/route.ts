import { requireAdmin } from "@/lib/auth";
import { getBackupData } from "@/lib/profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const backup = await getBackupData();
  const date = new Date().toISOString().slice(0, 10);
  return Response.json(backup, {
    headers: {
      "Content-Disposition": `attachment; filename="eprofile-backup-${date}.json"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
