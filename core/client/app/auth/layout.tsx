import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión | Compipro S.A.C.",
  description: "Accede al sistema CRM de Compipro S.A.C.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className="min-h-dvh">{children}</main>;
}