"use client";
/* eslint-disable @next/next/no-img-element */

import { Check, Copy, Printer, Share2 } from "lucide-react";
import { useState } from "react";

type QrShareCardProps = {
  slug: string;
  profileUrl: string;
  name: string;
  career: string;
  avatarUrl?: string | null;
};

export function QrShareCard({ slug, profileUrl, name, career, avatarUrl }: QrShareCardProps) {
  const [notice, setNotice] = useState("");

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  async function copyLink() {
    try {
      await navigator.clipboard?.writeText(profileUrl);
      showNotice("Enlace copiado al portapapeles.");
    } catch {
      showNotice("No se pudo copiar. Usa la URL impresa en la tarjeta.");
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `E-CV de ${name}`, url: profileUrl });
        showNotice("Enlace listo para compartir.");
      } catch {
        // Cancelar la hoja nativa no es un error que requiera mostrar alerta.
      }
      return;
    }
    await copyLink();
  }

  return (
    <aside className="presentation-card print-card">
      <div className="presentation-card__accent" />
      <div className="presentation-card__identity">
        <span className="presentation-card__avatar">{avatarUrl ? <img src={avatarUrl} alt="" width={48} height={48} /> : name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "EC"}</span>
        <div><p>Tarjeta de presentación</p><h2>{name}</h2><strong>{career}</strong></div>
      </div>
      <div className="presentation-card__body">
        <div><p className="eyebrow">Mi perfil profesional</p><p className="presentation-card__copy">Escanea para abrir mi E-CV, descargar mi CV y guardar mis datos de contacto.</p><code>{profileUrl.replace(/^https?:\/\//, "")}</code></div>
        <div className="presentation-card__qr">
          <img src={`/api/profile/${encodeURIComponent(slug)}/qr`} alt={`Código QR para el perfil de ${name}`} width={180} height={180} />
        </div>
      </div>
      <div className="presentation-card__actions no-print">
        <button type="button" className="button button--secondary" onClick={copyLink}><Copy size={16} /> Copiar enlace</button>
        <button type="button" className="button button--secondary" onClick={share}><Share2 size={16} /> Compartir</button>
        <button type="button" className="button button--primary" onClick={() => { window.print(); showNotice("Abriendo vista de impresión de la tarjeta."); }}><Printer size={16} /> Imprimir tarjeta</button>
      </div>
      {notice && <p className="action-notice" role="status"><Check size={15} /> {notice}</p>}
    </aside>
  );
}
