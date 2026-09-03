export default function FAQS() {
  return (
    <section className="w-full py-15 bg-gray-100 flex justify-center items-center">
      <div className="max-w-7xl w-full mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-center items-center gap-10 max-w-6xl w-full mx-auto">
          <div className="flex-1 text-center md:text-left max-w-full md:max-w-lg">
            <h2 className="md:text-left text-center text-3xl sm:text-4xl text-gray-800 mb-10">
              FAQs
            </h2>
            <div className="mt-5">
              <p className="mb-4 leading-relaxed text-gray-600">
                Aquí encontrarás respuestas a las preguntas más comunes sobre
                nuestros servicios y empresa. Si no encuentras lo que buscas, no
                dudes en contactarnos.
              </p>
              <p className="mb-4 leading-relaxed text-gray-600">
                Estamos comprometidos con brindar la información más clara y útil
                para nuestros clientes.
              </p>
            </div>
          </div>
          <div className="flex-1 flex justify-center items-center max-w-full md:max-w-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/web/FAQs.jpg"
              alt="CompPro Empresa FAQs"
              className="max-w-full h-auto rounded-lg shadow-md"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
