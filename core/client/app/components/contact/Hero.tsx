import { Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";

type Canal = {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
  externo?: boolean;
};

const canales: Canal[] = [
  { icon: Phone, label: "Teléfono", value: "(51) 932 230 880", href: "tel:+51932230880" },
  { icon: Mail, label: "Correo", value: "ventas@compipro.net", href: "mailto:ventas@compipro.net" },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "973 644 878",
    href: "https://wa.me/51973644878",
    externo: true,
  },
  {
    icon: MapPin,
    label: "Dirección",
    value: "Av. Las Flores de Primavera 184, San Juan de Lurigancho",
    href: "https://www.google.com/maps/search/?api=1&query=Av.+Las+Flores+de+Primavera+184,+San+Juan+de+Lurigancho",
    externo: true,
  },
];

export default function Hero() {
  return (
    <section className="relative mx-3 mt-24 overflow-hidden rounded-[2rem] bg-ink text-white sm:mt-28 md:rounded-[2.5rem]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-12 lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-panel" />
            Contacto
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Hablemos de tu <span className="text-accent">próximo proyecto</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
            Cuéntanos qué necesitas y un asesor comercial te enviará una
            cotización a la medida de tu marca.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {canales.map(({ icon: Icon, label, value, href, externo }) => (
            <a
              key={label}
              href={href}
              target={externo ? "_blank" : undefined}
              rel={externo ? "noopener noreferrer" : undefined}
              className="group flex items-start gap-4 rounded-[1.5rem] bg-white/5 p-5 ring-1 ring-white/10 transition-colors duration-300 hover:bg-white/10"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white transition-transform duration-300 group-hover:scale-105">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium uppercase tracking-wider text-white/50">
                  {label}
                </span>
                <span className="mt-1 block text-sm font-semibold leading-snug text-white">
                  {value}
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
