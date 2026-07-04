import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";

export const revalidate = 0;

async function getAgencies() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("monitor_agencies")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function MonitorAdminPage() {
  const agencies = await getAgencies();

  return (
    <div className="container-app py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitor · Admin</h1>
          <p className="text-gray-500 text-sm mt-1">{agencies.length} agencias configuradas</p>
        </div>
        <Link href="/monitor" className="btn-secondary text-sm">
          ← Ver feed
        </Link>
      </div>

      {/* Setup notice */}
      <div className="card p-5 mb-6 bg-amber-50 border border-amber-200">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="font-semibold text-amber-900 text-sm mb-1">Configuración de selectores requerida</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Las agencias están pre-cargadas con selectores CSS genéricos. Visita cada web, inspecciona el HTML de los listados y ajusta el <code className="bg-amber-100 px-1 rounded">selector_config</code> directamente en Supabase. Los errores de scraping aparecen en la columna "Error".
            </p>
          </div>
        </div>
      </div>

      {/* Agencies table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Agencia", "URL", "Intervalo", "Último scrape", "Errores", "Estado"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agencies.map((agency: any) => (
                <tr key={agency.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{agency.name}</td>
                  <td className="px-4 py-3">
                    <a href={agency.listing_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline truncate max-w-[200px] block">
                      {new URL(agency.listing_url).hostname}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{agency.scrape_interval_minutes}min</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {agency.last_scraped_at
                      ? new Date(agency.last_scraped_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
                      : "Nunca"}
                  </td>
                  <td className="px-4 py-3">
                    {agency.error_count > 0 ? (
                      <span className="text-red-500 font-medium">{agency.error_count}</span>
                    ) : (
                      <span className="text-gray-300">0</span>
                    )}
                    {agency.last_error && (
                      <p className="text-xs text-red-400 truncate max-w-[150px]" title={agency.last_error}>
                        {agency.last_error}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${agency.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${agency.active ? "bg-green-500" : "bg-gray-400"}`} />
                      {agency.active ? "Activa" : "Pausada"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Variables de entorno */}
      <div className="card p-5 mt-6">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
          </svg>
          Variables de entorno requeridas
        </h2>
        <div className="space-y-2 font-mono text-xs bg-gray-50 rounded-lg p-4 text-gray-700">
          <p><span className="text-gray-400"># Push notifications (VAPID)</span></p>
          <p>NEXT_PUBLIC_VAPID_PUBLIC_KEY=<span className="text-brand-600">tu-clave-publica-vapid</span></p>
          <p>VAPID_PRIVATE_KEY=<span className="text-brand-600">tu-clave-privada-vapid</span></p>
          <p className="pt-2"><span className="text-gray-400"># Vercel cron protection</span></p>
          <p>CRON_SECRET=<span className="text-brand-600">un-secreto-aleatorio</span></p>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Genera las claves VAPID corriendo: <code className="bg-gray-100 px-1 rounded">node -e &quot;const w=require(&apos;web-push&apos;);console.log(w.generateVAPIDKeys())&quot;</code>
        </p>
      </div>
    </div>
  );
}
