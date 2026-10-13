import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sileo";

import { AuthProvider } from "./hooks/useAuth";
import { EMPRESA, SITE_URL } from "./lib/site";
import "./styles/globals.css";
import "sileo/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const tituloBase = "Compipro S.A.C. | Agencia de merchandising en Perú";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: tituloBase,
    template: "%s | Compipro S.A.C.",
  },
  description: EMPRESA.descripcion,
  applicationName: EMPRESA.nombre,
  keywords: [
    "compipro",
    "merchandising",
    "merchandising Perú",
    "agencia de merchandising Lima",
    "artículos publicitarios",
    "productos promocionales",
    "regalos corporativos",
    "productos personalizados con logo",
  ],
  authors: [{ name: "Gabriel Polack" }],
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: EMPRESA.nombre,
    title: tituloBase,
    description: EMPRESA.descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: tituloBase,
    description: EMPRESA.descripcion,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-PE"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  );
}
