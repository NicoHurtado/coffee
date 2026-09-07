import type { Metadata, Viewport } from "next";
import { Geist_Mono, Urbanist } from "next/font/google"

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

// Urbanist: la geométrica del specimen de referencia. Redonda y ligera, es la
// que da el aire de los tableros que sirvieron de guía.
const fontSans = Urbanist({ subsets: ["latin"], variable: "--font-urbanist", display: "swap" });

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
