// Fase 0: layout raíz, metadatos y tipografía global de la aplicación.
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Padres Plus 50",
  description: "Campeonato Padres Plus 50 del Colegio Sagrado Corazón de Jesús",
  applicationName: "Padres Plus 50",
  appleWebApp: { capable: true, title: "Padres Plus 50", statusBarStyle: "default" },
  other: { google: "notranslate" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-scroll-behavior="smooth"><body className="antialiased">{children}</body></html>;
}
