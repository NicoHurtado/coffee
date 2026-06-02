import type { NextConfig } from "next"

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
]

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.8", "192.168.1.*", "*.local"],
  // Cachear los segmentos ya renderizados en el router del cliente. Por defecto
  // Next no cachea rutas dinámicas (staleTime 0), así que volver a una página
  // ya visitada (p. ej. la flechita "atrás" desde el detalle de una cuenta)
  // re-pedía el RSC al servidor y se sentía lento. Con esto, navegar entre
  // páginas ya vistas es instantáneo durante la ventana indicada.
  experimental: {
    staleTimes: {
      dynamic: 180, // segundos que se reutiliza una página dinámica sin refetch
      static: 300,
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
