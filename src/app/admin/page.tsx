/* eslint-disable @next/next/no-html-link-for-pages */
import Link from "next/link";
import { ArchiveRestore, Download, FileUp, KeyRound, LogOut, Plus, Settings2, ShieldCheck, Trash2, UserCheck, UserX, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import {
  createStudentAction,
  deleteStudentAction,
  importBackupAction,
  resetStudentPasswordAction,
  setStudentActiveAction,
} from "@/app/actions/admin";
import { getCurrentUser } from "@/lib/auth";
import { listAdminProfiles } from "@/lib/profiles";

export const dynamic = "force-dynamic";

function Status({ status }: { status: "empty" | "draft" | "published" }) {
  const labels = { empty: "Vacío", draft: "Borrador", published: "Publicado" };
  return <span className={`status status--${status}`}>{labels[status]}</span>;
}

export default async function AdminPage() {
  const actor = await getCurrentUser();
  if (!actor) redirect("/login?next=/admin");
  if (actor.role !== "admin") redirect("/");
  const profiles = await listAdminProfiles();
  const activeCount = profiles.filter((profile) => profile.isActive).length;
  const publishedCount = profiles.filter((profile) => profile.status === "published").length;

  return <main className="dashboard-page"><header className="dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">E</span><span>Profile</span></Link><div className="dashboard-nav__right"><span className="account-label"><ShieldCheck size={15} /> Administración global</span><form action={logoutAction}><button className="icon-button" title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut size={17} /></button></form></div></header><div className="admin-shell"><section className="admin-intro"><div><p className="eyebrow">Panel de plataforma</p><h1>Gestiona perfiles sin perder el control.</h1><p>Las cuentas se administran desde servidor; cada edición y publicación conserva snapshots separados.</p></div><div className="admin-stats"><article><Users size={19} /><strong>{profiles.length}</strong><span>estudiantes</span></article><article><UserCheck size={19} /><strong>{activeCount}</strong><span>cuentas activas</span></article><article><ShieldCheck size={19} /><strong>{publishedCount}</strong><span>publicados</span></article></div></section>

      <div className="admin-grid">
        <section className="admin-card"><div className="admin-card__heading"><span className="section-icon"><Plus size={18} /></span><div><p className="eyebrow">Altas</p><h2>Crear estudiante</h2></div></div><form action={createStudentAction} className="stack-form"><label className="field"><span>Correo institucional</span><input name="email" type="email" required placeholder="estudiante@ejemplo.edu.mx" /></label><label className="field"><span>Contraseña inicial</span><input name="password" type="password" minLength={12} required placeholder="Mínimo 12 caracteres" /></label><label className="field"><span>Slug permanente</span><input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required placeholder="nombre-apellido" /><small>Minúsculas, números y guiones. No podrá cambiarse.</small></label><button className="button button--primary button--wide" type="submit"><Plus size={16} /> Crear cuenta</button></form></section>
        <section className="admin-card admin-card--soft"><div className="admin-card__heading"><span className="section-icon"><Settings2 size={18} /></span><div><p className="eyebrow">Respaldo</p><h2>Exportar e importar</h2></div></div><p className="muted">El respaldo incluye snapshots, fotografías y hashes de contraseña para una restauración completa. Descárgalo y almacénalo cifrado.</p><div className="backup-actions"><a className="button button--secondary" href="/api/admin/backup"><Download size={16} /> Exportar JSON</a><form action={importBackupAction} encType="multipart/form-data" className="backup-import"><label className="upload-control"><FileUp size={16} /> Seleccionar respaldo<input name="backup" type="file" accept="application/json,.json" required /></label><button className="button button--primary" type="submit"><ArchiveRestore size={16} /> Importar</button></form></div></section>
      </div>

      <section className="admin-list"><div className="admin-list__heading"><div><p className="eyebrow">Directorio</p><h2>Perfiles y cuentas</h2></div><span className="muted">Estado del perfil y disponibilidad de la cuenta.</span></div><div className="table-wrap"><table><thead><tr><th>Estudiante</th><th>Slug</th><th>Perfil</th><th>Cuenta</th><th>Acciones</th></tr></thead><tbody>{profiles.map((profile) => <tr key={profile.id}><td><strong>{profile.email}</strong>{profile.hasUnpublishedChanges && <small>Cambios sin publicar</small>}</td><td><code>/{profile.slug}</code></td><td><Status status={profile.status} /></td><td><span className={`account-state ${profile.isActive ? "account-state--active" : "account-state--inactive"}`}>{profile.isActive ? "Activa" : "Inactiva"}</span></td><td><div className="row-actions"><Link className="button button--secondary button--small" href={`/admin/${profile.slug}`}>Editar</Link><form action={setStudentActiveAction}><input type="hidden" name="userId" value={profile.userId} /><input type="hidden" name="isActive" value={String(!profile.isActive)} /><button className="button button--secondary button--small" type="submit">{profile.isActive ? <><UserX size={14} /> Desactivar</> : <><UserCheck size={14} /> Activar</>}</button></form><details className="password-details"><summary><KeyRound size={14} /> Restablecer</summary><form action={resetStudentPasswordAction}><input type="hidden" name="userId" value={profile.userId} /><input name="password" type="password" minLength={12} required placeholder="Nueva contraseña" /><button className="button button--secondary button--small" type="submit">Guardar</button></form></details><form action={deleteStudentAction}><input type="hidden" name="userId" value={profile.userId} /><button className="button button--danger button--small" type="submit" title="Eliminar cuenta y todos sus snapshots"><Trash2 size={14} /> Eliminar</button></form></div></td></tr>)}</tbody></table>{profiles.length === 0 && <div className="empty-state"><Users size={28} /><h3>Aún no hay estudiantes</h3><p>Crea la primera cuenta para comenzar a gestionar perfiles.</p></div>}</div></section>
    </div></main>;
}
