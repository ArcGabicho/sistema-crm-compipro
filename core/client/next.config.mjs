/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // El módulo fijo de la feria pasó a ser el módulo genérico de Eventos.
      {
        source: "/dashboard/feria-resmine-2024",
        destination: "/dashboard/eventos",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
