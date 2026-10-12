import { EMPRESA, SITE_URL } from "@/app/lib/site";

// Ficha de empresa (schema.org) que usan Google y otros buscadores para mostrar
// datos de contacto y ubicación en los resultados.
export default function DatosEstructurados() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#empresa`,
    name: EMPRESA.nombre,
    description: EMPRESA.descripcion,
    url: SITE_URL,
    logo: `${SITE_URL}/web/logonavbar.webp`,
    image: `${SITE_URL}/opengraph-image`,
    telephone: EMPRESA.telefono,
    email: EMPRESA.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: EMPRESA.direccion.calle,
      addressLocality: EMPRESA.direccion.distrito,
      addressRegion: EMPRESA.direccion.region,
      addressCountry: EMPRESA.direccion.pais,
    },
    areaServed: { "@type": "Country", name: "Perú" },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
