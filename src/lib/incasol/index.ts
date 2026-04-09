/**
 * INCASÒL — Índex de referència de preus del lloguer (IRPL)
 *
 * Published by Agència de l'Habitatge de Catalunya under Decret Llei 11/2020
 * and reinforced by the Llei d'Habitatge 2023.
 *
 * All 73 Barcelona barrios are in "zona de mercat residencial tensionat" since
 * September 2022. Landlords cannot charge more than the IRPL reference price
 * unless the previous tenant's rent was higher (and they lived there ≥5 years).
 *
 * NOTE: These are district-level estimates based on the published 2024 IRPL
 * data. The exact cap depends on: census section, apartment m², year of
 * construction, and condition. Always verify at:
 * https://agenciahabitatge.gencat.cat/index-de-referencia-del-preu-del-lloguer/
 */

/**
 * District-level INCASÒL reference prices (€/m²) — 2024 approximation.
 *
 * Source: Agència de l'Habitatge de Catalunya — IRPL data 2024.
 * These are representative mid-range values per district.
 */
const INCASOL_BY_DISTRICT: Record<string, number> = {
  Eixample: 19.5,
  "Sarrià-Sant Gervasi": 21.0,
  "Les Corts": 20.5,
  Gràcia: 18.5,
  "Sants-Montjuïc": 15.5,
  "Horta-Guinardó": 14.5,
  "Nou Barris": 13.0,
  "Sant Andreu": 15.0,
  "Sant Martí": 17.0,
  "Ciutat Vella": 19.0,
};

/** Fallback when district is unknown */
const BARCELONA_INCASOL_AVG = 17.5;

/** Official complaint / index checker URL */
export const INCASOL_CHECKER_URL =
  "https://agenciahabitatge.gencat.cat/index-de-referencia-del-preu-del-lloguer/";

/** Sindicat de Llogateres free advice */
export const SINDICAT_URL = "https://sindicatdellogateres.org/";

export interface IncasolResult {
  /** Estimated €/m² reference according to INCASÒL index */
  incasolEurM2: number;
  /** Estimated legal maximum rent (€/month) */
  incasolMaxRent: number;
  /** How much above the legal max the listed rent is (0 if below) */
  overByMonthly: number;
  /** overByMonthly × 12 */
  overByAnnual: number;
  /** Whether the listed rent appears to exceed the INCASÒL cap */
  isAboveLimit: boolean;
  /** District used for the estimate */
  district: string;
}

/**
 * Estimate whether a listed rent appears to exceed the INCASÒL legal cap.
 *
 * @param district  - Barcelona district name
 * @param sqm       - Apartment surface area in m²
 * @param priceMonthly - Listed rent (€/month)
 */
export function checkIncasol(
  district: string,
  sqm: number,
  priceMonthly: number
): IncasolResult {
  const incasolEurM2 = INCASOL_BY_DISTRICT[district] ?? BARCELONA_INCASOL_AVG;
  const incasolMaxRent = Math.round(incasolEurM2 * sqm);
  const overByMonthly = Math.max(0, priceMonthly - incasolMaxRent);
  const overByAnnual = overByMonthly * 12;
  const isAboveLimit = overByMonthly > 0;

  return {
    incasolEurM2,
    incasolMaxRent,
    overByMonthly,
    overByAnnual,
    isAboveLimit,
    district,
  };
}

/**
 * Get the district name for a given barrio name.
 * Lazy import to avoid circular deps with zones.ts.
 */
export function getDistrictForBarrio(zoneName: string): string {
  // Inline district mapping to avoid import cycles
  const BARRIO_TO_DISTRICT: Record<string, string> = {
    "La Dreta de l'Eixample": "Eixample",
    "La Sagrada Família": "Eixample",
    "L'Antiga Esquerra de l'Eixample": "Eixample",
    "La Nova Esquerra de l'Eixample": "Eixample",
    "Sant Antoni": "Eixample",
    "El Gòtic": "Ciutat Vella",
    "El Raval": "Ciutat Vella",
    "La Barceloneta": "Ciutat Vella",
    "Sant Pere, Santa Caterina i la Ribera": "Ciutat Vella",
    "La Vila de Gràcia": "Gràcia",
    "El Camp d'en Grassot i Gràcia Nova": "Gràcia",
    "La Salut": "Gràcia",
    "El Coll": "Gràcia",
    "Vallcarca i els Penitents": "Gràcia",
    "Sants": "Sants-Montjuïc",
    "Hostafrancs": "Sants-Montjuïc",
    "La Bordeta": "Sants-Montjuïc",
    "Sants - Badal": "Sants-Montjuïc",
    "El Poble Sec": "Sants-Montjuïc",
    "La Marina del Prat Vermell": "Sants-Montjuïc",
    "La Marina de Port": "Sants-Montjuïc",
    "La Font de la Guatlla": "Sants-Montjuïc",
    "Vallvidrera, el Tibidabo i les Planes": "Sarrià-Sant Gervasi",
    "Sarrià": "Sarrià-Sant Gervasi",
    "Les Tres Torres": "Sarrià-Sant Gervasi",
    "Sant Gervasi - la Bonanova": "Sarrià-Sant Gervasi",
    "Sant Gervasi - Galvany": "Sarrià-Sant Gervasi",
    "El Putxet i el Farró": "Sarrià-Sant Gervasi",
    "Les Corts": "Les Corts",
    "La Maternitat i Sant Ramon": "Les Corts",
    "Pedralbes": "Les Corts",
    "El Poblenou": "Sant Martí",
    "El Clot": "Sant Martí",
    "El Camp de l'Arpa del Clot": "Sant Martí",
    "La Vila Olímpica del Poblenou": "Sant Martí",
    "El Parc i la Llacuna del Poblenou": "Sant Martí",
    "La Verneda i la Pau": "Sant Martí",
    "La Pau": "Sant Martí",
    "El Besòs i el Maresme": "Sant Martí",
    "Provençals del Poblenou": "Sant Martí",
    "Sant Martí de Provençals": "Sant Martí",
    "La Diagonal Mar i el Front Marítim del Poblenou": "Sant Martí",
    "El Baró de Viver": "Sant Andreu",
    "El Bon Pastor": "Sant Andreu",
    "Sant Andreu de Palomar": "Sant Andreu",
    "La Trinitat Vella": "Sant Andreu",
    "Baró de Viver": "Sant Andreu",
    "El Congrés i els Indians": "Sant Andreu",
    "La Sagrera": "Sant Andreu",
    "El Navas": "Sant Andreu",
    "La Trinitat Nova": "Nou Barris",
    "Torre Baró": "Nou Barris",
    "Ciutat Meridiana": "Nou Barris",
    "Vallbona": "Nou Barris",
    "Can Peguera": "Nou Barris",
    "La Guineueta": "Nou Barris",
    "Canyelles": "Nou Barris",
    "Les Roquetes": "Nou Barris",
    "Verdun": "Nou Barris",
    "La Prosperitat": "Nou Barris",
    "La Porta": "Nou Barris",
    "Vilapicina i la Torre Llobeta": "Nou Barris",
    "Turó de la Peira": "Nou Barris",
    "El Turó de la Peira": "Nou Barris",
    "La Teixonera": "Horta-Guinardó",
    "Sant Genís dels Agudells": "Horta-Guinardó",
    "Montbau": "Horta-Guinardó",
    "La Vall d'Hebron": "Horta-Guinardó",
    "La Clota": "Horta-Guinardó",
    "Horta": "Horta-Guinardó",
    "El Guinardó": "Horta-Guinardó",
    "Can Baró": "Horta-Guinardó",
    "El Baix Guinardó": "Horta-Guinardó",
    "La Font d'en Fargues": "Horta-Guinardó",
    "El Carmel": "Horta-Guinardó",
    "La Farinera del Clot": "Sant Martí",
    // District names themselves map to themselves
    Eixample: "Eixample",
    "Ciutat Vella": "Ciutat Vella",
    Gràcia: "Gràcia",
    "Sants-Montjuïc": "Sants-Montjuïc",
    "Sarrià-Sant Gervasi": "Sarrià-Sant Gervasi",
    "Sant Martí": "Sant Martí",
    "Sant Andreu": "Sant Andreu",
    "Nou Barris": "Nou Barris",
    "Horta-Guinardó": "Horta-Guinardó",
  };

  return BARRIO_TO_DISTRICT[zoneName] ?? "Eixample";
}
