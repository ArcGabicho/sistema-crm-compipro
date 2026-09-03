import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Toaster as SileoToaster } from "sileo";

import { AuthProvider } from "./hooks/useAuth";
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

const description = "Compipro S.A.C. es una agencia de marketing peruana especializada en diseño y produccion de productos de merchadising con miles de clientes.";
const image = "https://i.imgur.com/RYfsVS9.png";
const url = "https://astro-compipro-page.dev/";

export const metadata: Metadata = {
  title: "Compipro S.A.C.",
  description,
  keywords: [
    "compipro",
    "merchandising",
    "marketing",
    "agencia de marketing",
    "productos personalizados",
    "productos promocionales",
    "productos publicitarios",
    "productos de merchandising",
  ],
  authors: [{ name: "Gabriel Polack" }],
  openGraph: {
    type: "website",
    url,
    title: "Compipro S.A.C.",
    description,
    images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compipro S.A.C.",
    description,
    images: [image],
  },
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
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-center" />
        <SileoToaster position="bottom-right" theme="light" />
      </body>
    </html>
  );
}
