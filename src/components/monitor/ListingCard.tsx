import type { MonitorListing } from "@/app/monitor/page";

export default function ListingCard({ listing }: { listing: MonitorListing }) {
  return (
    <a
      href={listing.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow group"
    >
      {listing.image_url && (
        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
          <img
            src={listing.image_url}
            alt={listing.title ?? "Piso"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 line-clamp-2">
          {listing.title ?? "Piso en alquiler"}
        </p>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {formatRelative(listing.found_at)}
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
        {listing.price_monthly && (
          <span className="font-bold text-gray-900">
            {listing.price_monthly.toLocaleString("es-ES")}€/mes
          </span>
        )}
        {listing.sqm && <span>{listing.sqm}m²</span>}
        {listing.bedrooms && <span>{listing.bedrooms} hab.</span>}
        {listing.zone_name && <span>{listing.zone_name}</span>}
      </div>
      <p className="text-xs text-brand-600 font-medium">
        {listing.agency_name}
      </p>
    </a>
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}
