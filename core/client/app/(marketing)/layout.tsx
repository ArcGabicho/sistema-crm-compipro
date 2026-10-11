import Navbar from "@/app/components/shared/Navbar";
import Footer from "@/app/components/shared/Footer";
import Whatsapp from "@/app/components/shared/Whatsapp";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-frame">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <Whatsapp />
    </div>
  );
}
