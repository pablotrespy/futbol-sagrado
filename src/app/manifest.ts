// Manifest PWA: permite instalar la app en el dispositivo y ejecutarla en su
// propia ventana (standalone). Así "Cerrar" puede clausurar la ventana de verdad.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "padres-plus-50",
    name: "Padres Plus 50 — Campeonato Sagrado Corazón de Jesús",
    short_name: "Padres Plus 50",
    description: "Campeonato de fútbol Padres Plus 50 del Colegio Sagrado Corazón de Jesús",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0c0a09",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}