import Navbar from "@/app/components/shared/Navbar";
import Footer from "@/app/components/shared/Footer";
import Whatsapp from "@/app/components/shared/Whatsapp";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-canvas p-2 sm:p-4">
      <div className="flex min-h-[calc(100vh-1rem)] flex-col overflow-clip rounded-[2rem] bg-frame shadow-xl ring-4 ring-white/60 sm:min-h-[calc(100vh-2rem)] sm:rounded-[2.25rem]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <Whatsapp />
    </div>
  );
}
