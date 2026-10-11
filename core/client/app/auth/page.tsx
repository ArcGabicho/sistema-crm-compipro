import Form from "../components/auth/Form";
import Image from "next/image";

export default function HomePage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="flex w-full max-w-4xl flex-col items-stretch gap-4 rounded-[2.25rem] bg-frame p-3 shadow-xl ring-4 ring-white/60 md:flex-row md:p-4">
        <div className="flex flex-1 items-center justify-center rounded-[1.75rem] bg-panel shadow-sm ring-1 ring-white">
          <Form />
        </div>
        <div className="hidden flex-1 items-center justify-center rounded-[1.75rem] bg-panel p-6 shadow-sm ring-1 ring-white md:flex">
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
