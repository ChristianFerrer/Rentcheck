// Static zone data for Barcelona — used as fallback when Supabase is unavailable
export const BARCELONA_ZONES = [
  {
    id: "bcn-eixample",
    city: "barcelona",
    zone_name: "Eixample",
    center_lat: 41.3878,
    center_lng: 2.1654,
    eur_m2_ref: 20.5,
  },
  {
    id: "bcn-gracia",
    city: "barcelona",
    zone_name: "Gràcia",
    center_lat: 41.4025,
    center_lng: 2.1567,
    eur_m2_ref: 18.8,
  },
  {
    id: "bcn-sants",
    city: "barcelona",
    zone_name: "Sants",
    center_lat: 41.3752,
    center_lng: 2.1366,
    eur_m2_ref: 16.2,
  },
  {
    id: "bcn-sant-marti",
    city: "barcelona",
    zone_name: "Sant Martí",
    center_lat: 41.4151,
    center_lng: 2.2053,
    eur_m2_ref: 17.5,
  },
  {
    id: "bcn-ciutat-vella",
    city: "barcelona",
    zone_name: "Ciutat Vella",
    center_lat: 41.3825,
    center_lng: 2.177,
    eur_m2_ref: 19.2,
  },
  {
    id: "bcn-sarria",
    city: "barcelona",
    zone_name: "Sarrià",
    center_lat: 41.3993,
    center_lng: 2.1199,
    eur_m2_ref: 22.1,
  },
  {
    id: "bcn-les-corts",
    city: "barcelona",
    zone_name: "Les Corts",
    center_lat: 41.3842,
    center_lng: 2.1309,
    eur_m2_ref: 19.8,
  },
  {
    id: "bcn-horta",
    city: "barcelona",
    zone_name: "Horta",
    center_lat: 41.4278,
    center_lng: 2.1623,
    eur_m2_ref: 14.5,
  },
  {
    id: "bcn-nou-barris",
    city: "barcelona",
    zone_name: "Nou Barris",
    center_lat: 41.4398,
    center_lng: 2.1769,
    eur_m2_ref: 13.2,
  },
  {
    id: "bcn-sant-andreu",
    city: "barcelona",
    zone_name: "Sant Andreu",
    center_lat: 41.4337,
    center_lng: 2.1893,
    eur_m2_ref: 15.1,
  },
];

export function getZoneByName(zoneName: string) {
  return BARCELONA_ZONES.find(
    (z) => z.zone_name.toLowerCase() === zoneName.toLowerCase()
  );
}

export function getDefaultZone() {
  return BARCELONA_ZONES[0]; // Eixample as default
}
