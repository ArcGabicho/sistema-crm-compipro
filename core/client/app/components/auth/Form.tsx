"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function Form() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const session = await login(email, password);
      sileo.success({ title: `Bienvenido, ${session.name || session.email}` });
      router.push("/dashboard");
    } catch (error) {
      sileo.error({
        title: "No se pudo iniciar sesión",
        description:
          error instanceof Error ? error.message : "Inténtalo de nuevo.",
      });
      setIsLoading(false);
    }
  };

  return (
    <form
      className="px-10 py-8 flex flex-col gap-6 min-w-85 max-w-100"
      autoComplete="off"
      onSubmit={handleSubmit}
    >
      <div className="flex justify-center mb-2">
        <Image
          src={"/images/Compipro_Logo.webp"}
          alt="Logo Compipro"
          width={412}
          height={117}
          priority
          className="h-auto w-40"
        />
      </div>
      <h1 className="text-2xl font-bold text-center text-gray-800">
        ¡Bienvenido!
      </h1>
      <span className="text-center text-gray-500 text-sm">
        Ingrese sus credenciales para acceder al sistema CRM de Compina S.A.C.
      </span>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-gray-700 font-medium">
          Correo Electrónico
        </label>
        <input
          id="email"
          type="email"
          placeholder="user123@gmail.com"
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-gray-700 font-medium">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          placeholder="user123"
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="bg-yellow-400 hover:bg-yellow-700 text-white font-semibold rounded-md py-2 transition-colors mt-2 shadow flex text-center items-center justify-center"
      >
        {isLoading && <LoaderCircle className="mr-2 size-4 animate-spin" />}
        Ingresar
      </button>
    </form>
  );
}
