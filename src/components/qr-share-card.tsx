"use client";

import { Check, Copy, Printer, Share2 } from "lucide-react";
import { useState } from "react";

type QrShareCardProps = {
  slug: string;
  profileUrl: string;
  name: string;
};

export function QrShareCard({ slug, profileUrl, name }: QrShareCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard?.writeText(profileUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: `EProfile de ${name}`, url: profileUrl });
      return;
    }
    await copyLink();
  }

  return (
    <aside className="qr-card print-card">
      <div className="qr-card__topline" />
      <p className="eyebrow">Tarjeta digital</p>
      <h2>Conecta en un vistazo</h2>
      <p className="muted">Escanea el código o comparte el enlace permanente de este perfil.</p>
      <div className="qr-frame">
        {/* El endpoint confirma que el perfil sigue publicado y activo antes de generar el QR. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/profile/${encodeURIComponent(slug)}/qr`} alt={`Código QR para el perfil de ${name}`} width={220} height={220} />
      </div>
      <p className="qr-url">{profileUrl.replace(/^https?:\/\//, "")}</p>
      <div className="qr-actions no-print">
        <button type="button" className="button button--secondary" onClick={copyLink}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Enlace copiado" : "Copiar"}
        </button>
        <button type="button" className="button button--secondary" onClick={share}>
          <Share2 size={16} /> Compartir
        </button>
        <button type="button" className="icon-button" aria-label="Imprimir tarjeta" onClick={() => window.print()}>
          <Printer size={17} />
        </button>
      </div>
    </aside>
  );
}
