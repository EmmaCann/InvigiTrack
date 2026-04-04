import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

/**
 * next/font/google scarica il font a BUILD TIME e lo serve localmente.
 * Niente richieste a Google a runtime → più veloce e più privacy.
 *
 * La funzione Geist() crea una CSS variable (--font-geist-sans)
 * che poi usiamo in globals.css → @theme inline → --font-sans.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",   // mostra il testo subito con il font di sistema, poi lo swappa
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "InvigiTrack",
    template: "%s · InvigiTrack",
  },
  description: "Academic invigilation session management platform",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">{children}</body>
    </html>
  )
}
