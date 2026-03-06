import Link from "next/link";
import UrlInputForm from "@/components/analysis/UrlInputForm";
import AnalysisForm from "@/components/analysis/AnalysisForm";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
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

            <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
              Analiza cualquier piso de Idealista o Fotocasa con un clic y
              descubre si el precio es justo.
            </p>

            {/* UrlInputForm: shows bookmarklet CTA by default, loading+form when arriving from bookmarklet */}
            <UrlInputForm />
          </div>
        </div>
      </section>

      {/* How it works — bookmarklet flow */}
      <section className="py-20 bg-white">
        <div className="container-app">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cómo funciona
            </h2>
            <p className="text-gray-500 text-lg max-w-md mx-auto">
              Un clic desde Idealista o Fotocasa — y sabes si ese piso vale lo
              que piden
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "🔖",
                title: "Instala el bookmarklet",
                desc: "Arrastra el botón a la barra de favoritos de tu navegador. Solo se hace una vez y tarda menos de un minuto.",
                link: { label: "Instalar ahora →", href: "/bookmarklet" },
              },
              {
                step: "02",
                icon: "🏠",
                title: "Abre un piso en Idealista",
                desc: "Navega por Idealista o Fotocasa como siempre. Cuando veas un piso que te interese, ábrelo.",
              },
              {
                step: "03",
                icon: "📊",
                title: "Haz clic y obtén el veredicto",
                desc: "Pulsa el botón del favorito. RentCheck se abre automáticamente con los datos pre-rellenados y el análisis completo.",
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
                {item.link && (
                  <Link
                    href={item.link.href}
                    className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    {item.link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manual entry fallback */}
      <section id="analizar" className="py-20 bg-gray-50 scroll-mt-16">
        <div className="container-app">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-xs font-medium mb-4">
              Sin bookmarklet
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Introduce los datos manualmente
            </h2>
            <p className="text-gray-500">
              Rellena el formulario con los datos del anuncio y obtén el mismo
              análisis completo.
            </p>
          </div>
          <AnalysisForm />
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
            Descubre qué zonas de Barcelona tienen más pisos con buen precio
            ahora mismo.
          </p>
          <Link href="/radar" className="btn-secondary text-brand-700">
            Ver mapa →
          </Link>
        </div>
      </section>
    </div>
  );
}
