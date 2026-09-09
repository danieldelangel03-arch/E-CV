import Link from "next/link";
import { FilePenLine, LayoutDashboard, LogOut, PanelTopOpen, QrCode, Settings2, ShieldCheck } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";

type DashboardSidebarProps = {
  role: "admin" | "student";
  slug?: string;
  editingAsAdmin?: boolean;
};

export function DashboardSidebar({ role, slug, editingAsAdmin = false }: DashboardSidebarProps) {
  const isAdmin = role === "admin";
  return (
    <aside className="dashboard-sidebar no-print">
      <Link className="brand brand--light" href="/"><span className="brand-mark">E</span><span>E-CV</span></Link>
      <div className="dashboard-sidebar__identity"><span>{isAdmin ? <ShieldCheck size={15} /> : <PanelTopOpen size={15} />}</span><div><strong>{isAdmin ? "Plataforma" : "Mi espacio"}</strong><small>{editingAsAdmin ? "Edición administrativa" : isAdmin ? "Administrador" : "Estudiante"}</small></div></div>
      <nav className="dashboard-sidebar__nav" aria-label="Navegación privada">
        {isAdmin && <Link href="/admin"><LayoutDashboard size={17} /> Directorio</Link>}
        {slug && <Link href={`/${slug}/admin`}><FilePenLine size={17} /> {isAdmin ? "Editar perfil" : "Mi perfil"}</Link>}
        {slug && <Link href={`/${slug}`}><QrCode size={17} /> Ver E-CV pública</Link>}
        {isAdmin && <a href="#respaldo"><Settings2 size={17} /> Respaldo</a>}
      </nav>
      <div className="dashboard-sidebar__footer"><code>{slug ? `/${slug}` : "admin@plataforma"}</code><form action={logoutAction}><button type="submit"><LogOut size={16} /> Cerrar sesión</button></form></div>
    </aside>
  );
}
