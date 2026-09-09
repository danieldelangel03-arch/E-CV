import type { Metadata } from "next";
import "./globals.css";

import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "E-CV | Tarjetas profesionales para estudiantes",
  description: "Perfiles profesionales permanentes para estudiantes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}<ThemeToggle /></body>
    </html>
  );
}
