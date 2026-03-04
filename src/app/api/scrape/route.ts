import { NextRequest, NextResponse } from "next/server";
import type { ScrapedListing } from "@/lib/scraper/urlParser";

// Zone name aliases → canonical zone names
const ZONE_ALIASES: Record<string, string> = {
  eixample: "Eixample",
  "l'eixample": "Eixample",
  gracia: "Gràcia",
  gràcia: "Gràcia",
  "vila de gràcia": "Gràcia",
  sants: "Sants",
  "sants-montjuïc": "Sants",
  "sants montjuic": "Sants",
  montjuic: "Sants",
  "sant martí": "Sant Martí",
  "sant marti": "Sant Martí",
  poblenou: "Sant Martí",
  "diagonal mar": "Sant Martí",
  "el clot": "Sant Martí",
  "la verneda": "Sant Martí",
  "ciutat vella": "Ciutat Vella",
  gothic: "Ciutat Vella",
  gòtic: "Ciutat Vella",
  raval: "Ciutat Vella",
  "el raval": "Ciutat Vella",
  born: "Ciutat Vella",
  "el born": "Ciutat Vella",
  barceloneta: "Ciutat Vella",
  sarrià: "Sarrià",
  sarria: "Sarrià",
  "sant gervasi": "Sarrià",
  pedralbes: "Les Corts",
  "les corts": "Les Corts",
  horta: "Horta",
  "horta-guinardó": "Horta",
  "horta guinardo": "Horta",
  guinardó: "Horta",
  "nou barris": "Nou Barris",
  roquetes: "Nou Barris",
  trinitat: "Nou Barris",
  "sant andreu": "Sant Andreu",
  sagrera: "Sant Andreu",
  "la sagrera": "Sant Andreu",
};

function detectZone(text: string): string | undefined {
  const lower = text.toLowerCase();
  // Sort by length descending so longer (more specific) names match first
  const sorted = Object.keys(ZONE_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    if (lower.includes(alias)) {
      return ZONE_ALIASES[alias];
    }
  }
  return undefined;
}

function parseNumber(s: string): number {
  // Remove thousands separators (. in Spanish) and trim
  return parseInt(s.replace(/\./g, "").replace(/,/g, ""), 10);
}

function parseListing(text: string): ScrapedListing {
  const result: ScrapedListing = {};

  // --- Price: look for "X.XXX €/mes", "X.XXX € al mes", "X.XXX €/month" ---
  const priceMatch = text.match(
    /(\d[\d.]*)\s*€\s*(?:\/\s*mes|al\s+mes|\/\s*month)/i
  );
  if (priceMatch) {
    result.price_monthly = parseNumber(priceMatch[1]);
  }

  // --- Surface area: first occurrence of "XX m²" or "XX m2" ---
  // Prefer the one that appears in context of the listing (avoid footnotes)
  const sqmMatches = [...text.matchAll(/(\d+)\s*m[²2]/gi)];
  if (sqmMatches.length > 0) {
    // Take the first reasonable value (20–500 m²)
    for (const m of sqmMatches) {
      const v = parseInt(m[1], 10);
      if (v >= 20 && v <= 500) {
        result.sqm = v;
        break;
      }
    }
  }

  // --- Bedrooms ---
  const bedroomsMatch = text.match(/(\d+)\s*habitacion(?:es)?/i) ||
    text.match(/(\d+)\s*hab\b/i) ||
    text.match(/(\d+)\s*dormitorio/i);
  if (bedroomsMatch) {
    result.bedrooms = Math.min(parseInt(bedroomsMatch[1], 10), 5);
  }

  // --- Bathrooms ---
  const bathroomsMatch = text.match(/(\d+)\s*ba[ñn]o/i) ||
    text.match(/(\d+)\s*ba[ñn]/i);
  if (bathroomsMatch) {
    result.bathrooms = Math.min(parseInt(bathroomsMatch[1], 10), 3);
  }

  // --- Floor ---
  const floorMatch =
    text.match(/(\d+)[aª°]\s*planta/i) ||
    text.match(/planta\s*(\d+)/i) ||
    text.match(/(\d+)(?:st|nd|rd|th)\s*floor/i);
  if (floorMatch) {
    result.floor = Math.min(parseInt(floorMatch[1], 10), 10);
  } else if (/\bbajo\b|\bplanta baja\b/i.test(text)) {
    result.floor = 0;
  }

  // --- Features from text ---
  const lower = text.toLowerCase();
  if (/\bascensor\b/i.test(lower)) result.has_elevator = true;
  if (/\bterraza\b|\bbalc[oó]n\b/i.test(lower)) result.has_terrace = true;
  if (/\bamueblad[oa]\b|\bcon muebles\b/i.test(lower)) result.furnished = true;
  if (/\bgastos incluidos\b|\bsuministros incluidos\b|\bcon gastos\b/i.test(lower)) {
    // bills_included not in ScrapedListing type but we detect it anyway
  }

  // --- Zone ---
  result.zone_name = detectZone(text);
  result.city = "barcelona";

  return result;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    // Use Jina AI Reader — renders the page (handles JS + bot protection) and returns clean text
    const jinaUrl = `https://r.jina.ai/${url}`;
    const res = await fetch(jinaUrl, {
      headers: {
        Accept: "text/plain",
        "X-Return-Format": "text",
        // Jina reads in English by default; keep Spanish
        "Accept-Language": "es-ES,es;q=0.9",
      },
      // 15s timeout is enough for Jina
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudo obtener el anuncio" },
        { status: 502 }
      );
    }

    const text = await res.text();

    if (!text || text.length < 100) {
      return NextResponse.json(
        { error: "El anuncio no devolvió contenido suficiente" },
        { status: 422 }
      );
    }

    const listing = parseListing(text);

    // Require at least price or sqm to consider it a success
    if (!listing.price_monthly && !listing.sqm) {
      return NextResponse.json(
        { error: "No se pudieron extraer datos del anuncio" },
        { status: 422 }
      );
    }

    return NextResponse.json(listing);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
