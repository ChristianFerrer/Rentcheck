import { createAdminClient } from "@/lib/supabase/server";
import PushSubscribeButton from "@/components/monitor/PushSubscribeButton";
import ListingCard from "@/components/monitor/ListingCard";

export const revalidate = 60;

export interface MonitorListing {
  id: string;
  url: string;
  title: string | null;
  price_monthly: number | null;
  sqm: number | null;
  bedrooms: number | null;
  zone_name: string | null;
  image_url: string | null;
  found_at: string;
  agency_name: string;
}

async function getRecentListings(): Promise<MonitorListing[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("monitor_listings")
      .select("id,url,title,price_monthly,sqm,bedrooms,zone_name,image_url,found_at,monitor_agencies(name)")
      .order("found_at", { ascending: false })
      .limit(60);
    return (data ?? []).map((row: any) => ({
      ...row,
      agency_name: row.monitor_agencies?.name ?? "Agencia",
    }));
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const supabase = createAdminClient();
    const [{ count: totalListings }, { count: totalAgencies }] = await Promise.all([
      supabase.from("monitor_listings").select("*", { count: "exact", head: true }),
      supabase.from("monitor_agencies").select("*", { count: "exact", head: true }).eq("active", true),
    ]);
    return { totalListings: totalListings ?? 0, totalAgencies: totalAgencies ?? 0 };
  } catch {
    return { totalListings: 0, totalAgencies: 0 };
  }
}

export default async function MonitorPage() {
  const [listings, stats] = await Promise.all([getRecentListings(), getStats()]);

  return (
    <div className="container-app py-10">
      {/* Header */}
      <div className="max-w-2xl mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
          <span className="w-1.5 h-1.5 bg-brand-600 rounded-full animate-pulse" />
          Monitor en tiempo real
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Pisos de agencias locales
        </h1>
        <p className="text-gray-500 mb-6">
          Monitoreamos {stats.totalAgencies} agencias barcelonesas que no publican en portales. Activa las alertas para recibir una notificación en tu navegador cuando aparezca un piso nuevo.
        </p>

        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-6">
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalListings.toLocaleString("es-ES")}</p>
            <p className="text-xs text-gray-400">pisos encontrados</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalAgencies}</p>
            <p className="text-xs text-gray-400">agencias monitoreadas</p>
          </div>
        </div>

        {/* Subscribe card */}
        <div className="card p-5 bg-brand-50 border-brand-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Recibe alertas instantáneas</h2>
              <p className="text-sm text-gray-500">
                Te avisamos en el momento en que detectemos un piso nuevo que encaje con tu búsqueda.
              </p>
            </div>
            <PushSubscribeButton />
          </div>
        </div>
      </div>

      {/* Listings grid */}
      {listings.length > 0 ? (
        <>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Últimos pisos detectados
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aún no hay pisos</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            El monitor está activo. Los pisos aparecerán aquí en cuanto empecemos a detectarlos en las agencias.
          </p>
        </div>
      )}
    </div>
  );
}
