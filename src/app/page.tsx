import Link from "next/link";
import UrlInputForm from "@/components/analysis/UrlInputForm";
import AnalysisForm from "@/components/analysis/AnalysisForm";
import { createAdminClient } from "@/lib/supabase/server";

export const revalidate = 300;

async function getAnalysesCount(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("listings_analyses")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function HomePage() {
  const analysesCount = await getAnalysesCount();
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

            {/* Social proof counter */}
            {analysesCount > 0 && (
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-600">
                  <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>
                    <strong className="text-gray-900">{analysesCount.toLocaleString("es-ES")}</strong> pisos analizados en Barcelona
                  </span>
                </div>
              </div>
            )}

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

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="container-app">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cómo funciona
            </h2>
          </div>

          {/* Mobile steps: formulario manual */}
          <div className="grid grid-cols-1 gap-6 md:hidden">
            {[
              {
                step: "01",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                  </svg>
                ),
                title: "Rellena los datos del piso",
                desc: "Introduce el barrio, precio, metros y características del anuncio en el formulario de abajo.",
                link: { label: "Ir al formulario →", href: "#analizar" },
              },
              {
                step: "02",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                ),
                title: "RentCheck analiza el precio",
                desc: "Comparamos el precio con los datos oficiales de la Generalitat de Catalunya y pisos similares.",
              },
              {
                step: "03",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                ),
                title: "Veredicto instantáneo",
                desc: "Recibes: Buen precio, Precio medio o Elevado — con el porcentaje exacto sobre o bajo el mercado.",
              },
            ].map((item) => (
              <div key={item.step} className="card p-6 flex gap-5 items-start">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 text-brand-600">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-bold text-brand-400 tracking-widest mb-1">{item.step}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  {item.link && (
                    <a href={item.link.href} className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                      {item.link.label}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop steps: bookmarklet flow */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                ),
                title: "Instala el bookmarklet",
                desc: "Arrastra el botón a la barra de favoritos de tu navegador. Solo se hace una vez y tarda menos de un minuto.",
                link: { label: "Instalar ahora →", href: "/bookmarklet" },
              },
              {
                step: "02",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                ),
                title: "Abre un piso en Idealista",
                desc: "Navega por Idealista o Fotocasa como siempre. Cuando veas un piso que te interese, ábrelo.",
              },
              {
                step: "03",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                ),
                title: "Haz clic y obtén el veredicto",
                desc: "Pulsa el botón del favorito. RentCheck se abre automáticamente con los datos pre-rellenados y el análisis completo.",
              },
            ].map((item) => (
              <div key={item.step} className="card p-8 relative">
                <div className="text-xs font-bold text-brand-400 tracking-widest mb-4">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-4 text-brand-600">
                  {item.icon}
                </div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Introduce los datos del piso
            </h2>
            <p className="text-gray-500">
              Rellena el formulario con los datos del anuncio y obtén el análisis completo.
            </p>
          </div>
          <AnalysisForm />
        </div>
      </section>

      {/* Radar CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-600 to-brand-800">
        <div className="container-app text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
          </div>
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
