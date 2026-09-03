import Form from "../components/auth/Form";
import Image from "next/image";

export default function HomePage() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col md:flex-row items-center gap-12 bg-white/80 rounded-2xl shadow-2xl p-8 md:p-12">
        <div>
          <Form />
        </div>
        <div className="hidden md:block">
          <Image
            src={"/images/Mobile-login-rafiki.svg"}
            alt="Login Image"
            width={400}
            height={400}
            className="drop-shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}
