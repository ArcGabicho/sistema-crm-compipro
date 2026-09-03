export default function Nosotros() {
  return (
    <section className="w-full py-15 bg-gray-100 flex justify-center items-center">
      <div className="max-w-7xl w-full mx-auto px-4">
        <h2 className="text-center mb-10 text-3xl sm:text-4xl text-gray-800">
          ¿Quienes Somos?
        </h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-10 max-w-6xl w-full mx-auto">
          <div className="flex-1 text-center md:text-left max-w-full md:max-w-lg mb-8 md:mb-0">
            <p className="mb-4 leading-relaxed text-gray-600">
              COMPIPRO S.A.C es tu mejor opción. Somos una empresa peruana
              dedica a la oferta de artículos y productos publicitarios de alta
              calidad y diseño para eventos, ferias, regalos corporativos y para
              la industria en general. Contamos con infraestructura propia y
              trabajamos con &quot;Partners Estratégicos&quot; a nivel nacional e
              internacional, los cuales nos permiten brindar servicios con mayor
              calidad, rapidez y garantía a costos muy competitivos.
            </p>
          </div>
          <div className="flex-1 flex justify-center items-center max-w-full md:max-w-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/web/compipro-img.png"
              alt="Logo CompiPro Empresa"
              className="max-w-full h-auto rounded-lg shadow-md"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
