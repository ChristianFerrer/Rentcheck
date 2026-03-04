import Link from "next/link";
import UrlInputForm from "@/components/analysis/UrlInputForm";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-blue-50 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="container-app relative pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-6">
              <span className="w-1.5 h-1.5 bg-brand-600 rounded-full animate-pulse" />
              Análisis en tiempo real · Barcelona
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              ¿Este piso está caro
              <br />
              <span className="text-brand-600">o es una oportunidad?</span>
            </h1>

            <p className="text-xl text-gray-500 mb-12 max-w-xl mx-auto leading-relaxed">
              Analiza cualquier anuncio de alquiler y descubre si el precio está
              inflado o por debajo del mercado.
            </p>

            {/* Main input */}
            <UrlInputForm />

            {/* Social proof */}
            <div className="flex items-center justify-center gap-6 mt-10 text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Sin registro
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Gratis
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Resultados en segundos
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="container-app">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cómo funciona
            </h2>
            <p className="text-gray-500 text-lg max-w-md mx-auto">
              En tres pasos sabes si ese piso vale lo que piden por él
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "🔗",
                title: "Pega el link o introduce datos",
                desc: "Copia la URL del anuncio de Idealista, Fotocasa o Habitaclia, o rellena el formulario manual.",
              },
              {
                step: "02",
                icon: "🧮",
                title: "Analizamos el mercado",
                desc: "Comparamos el precio con el €/m² de referencia de la zona, ajustado por ascensor, terraza, estado y planta.",
              },
              {
                step: "03",
                icon: "📊",
                title: "Resultado instantáneo",
                desc: "Recibes el veredicto: Buen precio, Precio medio o Elevado — con datos comparables y texto de negociación.",
              },
            ].map((item) => (
              <div key={item.step} className="card p-8 relative">
                <div className="text-xs font-bold text-brand-400 tracking-widest mb-4">
                  {item.step}
                </div>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 text-lg mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Radar CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-600 to-brand-800">
        <div className="container-app text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Radar de oportunidades
          </h2>
          <p className="text-brand-200 text-lg mb-8 max-w-md mx-auto">
            Descubre qué zonas de Barcelona tienen más pisos con buen precio en
            este momento.
          </p>
          <Link href="/radar" className="btn-secondary text-brand-700">
            Ver mapa →
          </Link>
        </div>
      </section>
    </div>
  );
}
