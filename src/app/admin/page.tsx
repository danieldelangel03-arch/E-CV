import Link from "next/link";
import { ArchiveRestore, Download, FileUp, KeyRound, Plus, Settings2, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { redirect } from "next/navigation";

import {
  createStudentAction,
  importBackupAction,
  resetStudentPasswordAction,
  setStudentActiveAction,
} from "@/app/actions/admin";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DeleteStudentForm } from "@/components/delete-student-form";
import { getCurrentUser } from "@/lib/auth";
import { listAdminProfiles } from "@/lib/profiles";

export const dynamic = "force-dynamic";

function Status({ status }: { status: "empty" | "draft" | "published" }) {
  const labels = { empty: "Vacío", draft: "Borrador", published: "Publicado" };
  return <span className={`status status--${status}`}>{labels[status]}</span>;
}

const notices: Record<string, string> = {
  created: "Cuenta manual creada correctamente.",
  activated: "La cuenta fue reactivada.",
  deactivated: "La cuenta fue desactivada y sus sesiones se revocaron.",
  "password-reset": "La contraseña se actualizó y las sesiones previas se cerraron.",
  deleted: "La cuenta y su E-CV se eliminaron correctamente.",
  "backup-imported": "El respaldo se importó correctamente.",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const actor = await getCurrentUser();
  if (!actor) redirect("/login?next=/admin");
  if (actor.role !== "admin") redirect("/");
  const profiles = await listAdminProfiles();
  const activeCount = profiles.filter((profile) => profile.isActive).length;
  const publishedCount = profiles.filter((profile) => profile.status === "published").length;

  return <main className="dashboard-page"><DashboardSidebar role="admin" /><div className="dashboard-main"><div className="admin-shell"><section className="admin-intro"><div><p className="eyebrow">Panel de plataforma</p><h1>Gestiona perfiles sin perder el control.</h1><p>Las cuentas, orígenes y publicaciones se administran en servidor. Cada edición conserva snapshots privados.</p></div><div className="admin-stats"><article><Users size={19} /><strong>{profiles.length}</strong><span>estudiantes</span></article><article><UserCheck size={19} /><strong>{activeCount}</strong><span>cuentas activas</span></article><article><ShieldCheck size={19} /><strong>{publishedCount}</strong><span>publicados</span></article></div></section>{notice && notices[notice] && <p className="action-notice" role="status">{notices[notice]}</p>}

      <div className="admin-grid">
        <section className="admin-card"><div className="admin-card__heading"><span className="section-icon"><Plus size={18} /></span><div><p className="eyebrow">Alta manual</p><h2>Crear estudiante</h2></div></div><form action={createStudentAction} className="stack-form"><label className="field"><span>Correo institucional</span><input name="email" type="email" required placeholder="estudiante@ejemplo.edu.mx" /></label><label className="field"><span>Contraseña inicial</span><input name="password" type="password" minLength={12} required placeholder="Mínimo 12 caracteres" /></label><label className="field"><span>Slug permanente</span><input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required placeholder="nombre-apellido" /><small>Minúsculas, números y guiones. No podrá cambiarse.</small></label><button className="button button--primary button--wide" type="submit"><Plus size={16} /> Crear cuenta manual</button></form></section>
        <section id="respaldo" className="admin-card admin-card--soft"><div className="admin-card__heading"><span className="section-icon"><Settings2 size={18} /></span><div><p className="eyebrow">Respaldo</p><h2>Exportar e importar</h2></div></div><p className="muted">El respaldo incluye origen, snapshots, fotografías y hashes de contraseña para una restauración completa. Descárgalo y almacénalo cifrado.</p><div className="backup-actions"><Link className="button button--secondary" href="/api/admin/backup"><Download size={16} /> Exportar JSON</Link><form action={importBackupAction} encType="multipart/form-data" className="backup-import"><label className="upload-control"><FileUp size={16} /> Seleccionar respaldo<input name="backup" type="file" accept="application/json,.json" required /></label><button className="button button--primary" type="submit"><ArchiveRestore size={16} /> Importar</button></form></div></section>
      </div>

      <section className="admin-list"><div className="admin-list__heading"><div><p className="eyebrow">Directorio</p><h2>Perfiles y cuentas</h2></div><span className="muted">Estado, disponibilidad y origen de cada cuenta.</span></div><div className="table-wrap"><table><thead><tr><th>Estudiante</th><th>Slug</th><th>Origen</th><th>Perfil</th><th>Cuenta</th><th>Acciones</th></tr></thead><tbody>{profiles.map((profile) => <tr key={profile.id}><td><strong>{profile.email}</strong>{profile.hasUnpublishedChanges && <small>Cambios sin publicar</small>}</td><td><code>/{profile.slug}</code></td><td><span className={`origin origin--${profile.origin}`}>{profile.origin === "auto" ? "Auto-registro" : "Manual"}</span></td><td><Status status={profile.status} /></td><td><span className={`account-state ${profile.isActive ? "account-state--active" : "account-state--inactive"}`}>{profile.isActive ? "Activa" : "Inactiva"}</span></td><td><div className="row-actions"><Link className="button button--secondary button--small" href={`/admin/${profile.slug}`}>Editar</Link><form action={setStudentActiveAction}><input type="hidden" name="userId" value={profile.userId} /><input type="hidden" name="isActive" value={String(!profile.isActive)} /><button className="button button--secondary button--small" type="submit">{profile.isActive ? <><UserX size={14} /> Desactivar</> : <><UserCheck size={14} /> Activar</>}</button></form><details className="password-details"><summary><KeyRound size={14} /> Restablecer</summary><form action={resetStudentPasswordAction}><input type="hidden" name="userId" value={profile.userId} /><input name="password" type="password" minLength={12} required placeholder="Nueva contraseña" /><button className="button button--secondary button--small" type="submit">Guardar</button></form></details><DeleteStudentForm userId={profile.userId} email={profile.email} /></div></td></tr>)}</tbody></table>{profiles.length === 0 && <div className="empty-state"><Users size={28} /><h3>Aún no hay estudiantes</h3><p>Crea la primera cuenta para comenzar a gestionar perfiles.</p></div>}</div></section>
    </div></div></main>;
}
