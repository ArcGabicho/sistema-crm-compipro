type Valor = {
  icon: string;
  title: string;
  description: string;
};

const data: Valor[] = [
  {
    icon: "🎨",
    title: "Creatividad",
    description: "Buscamos soluciones innovadoras y únicas para cada desafío.",
  },
  {
    icon: "⏰",
    title: "Puntualidad",
    description: "Cumplimos con nuestros compromisos en el tiempo acordado.",
  },
  {
    icon: "✅",
    title: "Calidad",
    description: "Nos comprometemos con la excelencia en cada servicio.",
  },
  {
    icon: "👥",
    title: "Atención",
    description: "Brindamos un servicio personalizado y cercano.",
  },
];

export default function Valores() {
  return (
    <section className="w-full py-15 bg-gray-50 flex justify-center items-center">
      <div className="max-w-7xl w-full mx-auto px-4">
        <h2 className="text-center mb-10 text-3xl sm:text-4xl text-gray-800">
          Nuestros Valores
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full mx-auto">
          {data.map((value) => (
            <div
              key={value.title}
              className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-2 border border-gray-50"
            >
              <div className="text-6xl mb-5 text-gray-600 opacity-80">
                {value.icon}
              </div>
              <h3 className="mb-4 text-gray-800 text-xl font-semibold tracking-tight">
                {value.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
