import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Coffee",
  description: "Gestión de finanzas personales",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Coffee",
    startupImage: "/stat_icon.svg",
  },
  icons: {
    icon: "/stat_icon.svg",
    apple: "/stat_icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Apple usa SF Pro y no se puede servir fuera de sus plataformas: el stack
// arranca en la del sistema —SF real en iPhone y Mac— y cae en Inter, que es
// la más cercana, para Windows, Android y Linux.
const fontSans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", fontSans.variable)}
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
