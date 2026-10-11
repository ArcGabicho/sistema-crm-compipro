import Link from "next/link";
import Facebook from "../../icons/Facebook";
import Instagram from "../../icons/Instagram";
import Linkedin from "../../icons/Linkedin";
import Pinterest from "../../icons/Pinterest";

const lineasPrincipales = [
  { name: "Línea Madera", href: "#" },
  { name: "Publicidad Exterior", href: "#" },
  { name: "Uniformes Corporativos", href: "#" },
  { name: "Accesorios Tecnológicos", href: "#" },
];

const contactoInfo = [
  { text: "contacto@merchmaster.com", href: "mailto:contacto@merchmaster.com" },
  { text: "+51 123 456 789", href: "tel:+51123456789" },
  { text: "Av. Principal 123, Lima", href: "#" },
];

const redesSociales = [Facebook, Instagram, Linkedin, Pinterest];

export default function Footer() {
  return (
    <footer className="mx-3 mb-3 mt-12 rounded-[2rem] bg-ink py-16 text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Logo y botón */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/web/logofooter.webp"
            alt="Logo Compipro"
            className="max-w-60 w-full h-auto mb-4 md:mb-0"
          />
          <Link
            href="/auth"
            className="bg-accent text-white font-semibold px-8 py-3 rounded-full hover:brightness-95 transition-colors duration-300"
          >
            Sistema CRM
          </Link>
        </div>

        {/* Línea divisoria */}
        <hr className="border-white/20 border-t mb-8" />

        {/* Sección de widgets */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Widget 1: Sobre Compipro */}
          <div className="md:col-span-1">
            <h5 className="font-bold text-lg mb-4">Sobre Compipro</h5>
            <div className="text-sm space-y-2">
              <p>
                © 2025 COMPIPRO S.A.C. - Soluciones en artículos publicitarios y
                merchandising empresarial. Creatividad, calidad y puntualidad
                para potenciar tu marca.
              </p>
              <p>
                Visítanos en{" "}
                <a
                  href="https://compipro.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline hover:text-blue-300"
                >
                  compipro.com
                </a>
              </p>
              <p>Contacto: ventas@compipro.net</p>
            </div>
            {/* Iconos sociales móvil */}
            <div className="flex justify-center md:justify-start gap-4 mt-4">
              {redesSociales.map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="text-white hover:text-orange-400 transition-colors duration-300"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Widget 2: Líneas Principales */}
          <div className="hidden md:block">
            <h5 className="font-bold text-lg mb-4">Líneas Principales</h5>
            <div className="text-sm space-y-2">
              {lineasPrincipales.map((linea) => (
                <a
                  key={linea.name}
                  href={linea.href}
                  className="block text-white hover:text-blue-400 hover:underline transition-colors duration-200"
                >
                  {linea.name}
                </a>
              ))}
            </div>
          </div>

          {/* Widget 3: Contacto */}
          <div className="hidden md:block">
            <h5 className="font-bold text-lg mb-4">Contacto</h5>
            <div className="text-sm space-y-2">
              {contactoInfo.map((info) => (
                <a
                  key={info.text}
                  href={info.href}
                  className="block text-white hover:text-blue-400 hover:underline transition-colors duration-200"
                >
                  {info.text}
                </a>
              ))}
            </div>
          </div>

          {/* Widget 4: Redes Sociales */}
          <div className="hidden md:block">
            <h5 className="font-bold text-lg mb-4">Redes Sociales</h5>
            <div className="flex gap-4">
              {redesSociales.map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="text-white hover:text-orange-400 transition-colors duration-300"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}