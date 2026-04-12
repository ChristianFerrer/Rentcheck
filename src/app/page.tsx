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

            <p className="text-xl text-gray-500 mb-4 max-w-xl mx-auto leading-relaxed">
              Comprueba si el precio supera el límite legal de alquiler en Barcelona. Análisis gratuito en 30 segundos.
            </p>

            {/* Trust badge */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-10">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Basado en datos oficiales de la Generalitat de Catalunya e Índex IRPL
            </div>

            <UrlInputForm />

            {/* Demo result card */}
            <div className="mt-10 max-w-lg mx-auto">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Ejemplo de análisis real</p>
              <div className="card overflow-hidden shadow-lg text-left">
                <div className="bg-gradient-to-r from-red-500 to-rose-600 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-wider mb-2">Veredicto · Eixample, Barcelona</p>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-bold">
                        <span className="w-2 h-2 bg-red-300 rounded-full" />
                        Precio elevado
                      </span>
                      <p className="text-white/80 text-sm mt-2">⚖️ Supera el índice legal en ~735€/mes</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-3xl font-bold">2.100€</p>
                      <p className="text-white/70 text-xs">/mes · 70m²</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100 text-center">
                  <div className="p-3">
                    <p className="text-xs text-gray-400">Precio estimado</p>
                    <p className="font-bold text-gray-900 text-sm">1.855€</p>
                    <p className="text-xs text-gray-400">mercado</p>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-400">Máx. legal IRPL</p>
                    <p className="font-bold text-red-600 text-sm">1.365€</p>
                    <p className="text-xs text-gray-400">19.5€/m² × 70</p>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-400">Diferencia</p>
                    <p className="font-bold text-red-600 text-sm">+13.2%</p>
                    <p className="text-xs text-gray-400">vs mercado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manual entry */}
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
    </div>
  );
}
