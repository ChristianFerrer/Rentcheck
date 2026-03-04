import { NextRequest, NextResponse } from "next/server";
import type { ScrapedListing } from "@/lib/scraper/urlParser";

// Zone name aliases → canonical zone names
const ZONE_ALIASES: Record<string, string> = {
  eixample: "Eixample",
  "l-eixample": "Eixample",
  "l'eixample": "Eixample",
  gracia: "Gràcia",
  "vila-de-gracia": "Gràcia",
  "vila-de-gràcia": "Gràcia",
  sants: "Sants",
  "sants-montjuic": "Sants",
  "sants-montjuïc": "Sants",
  montjuic: "Sants",
  "sant-marti": "Sant Martí",
  "sant-martí": "Sant Martí",
  poblenou: "Sant Martí",
  "diagonal-mar": "Sant Martí",
  "el-clot": "Sant Martí",
  "la-verneda": "Sant Martí",
  "22-arroba": "Sant Martí",
  "ciudad-vella": "Ciutat Vella",
  "ciutat-vella": "Ciutat Vella",
  gothic: "Ciutat Vella",
  "barrio-gotico": "Ciutat Vella",
  raval: "Ciutat Vella",
  "el-raval": "Ciutat Vella",
  born: "Ciutat Vella",
  barceloneta: "Ciutat Vella",
  sarria: "Sarrià",
  "sarrià": "Sarrià",
  "sant-gervasi": "Sarrià",
  pedralbes: "Les Corts",
  "les-corts": "Les Corts",
  horta: "Horta",
  "horta-guinardo": "Horta",
  "horta-guinardó": "Horta",
  guinardo: "Horta",
  "nou-barris": "Nou Barris",
  roquetes: "Nou Barris",
  trinitat: "Nou Barris",
  "sant-andreu": "Sant Andreu",
  sagrera: "Sant Andreu",
  "la-sagrera": "Sant Andreu",
};

const ZONE_ALIASES_TEXT: Record<string, string> = Object.fromEntries(
  Object.entries(ZONE_ALIASES).map(([k, v]) => [k.replace(/-/g, " "), v])
);

function detectZoneFromText(text: string): string | undefined {
  const lower = text.toLowerCase();
  const allAliases = { ...ZONE_ALIASES_TEXT, ...ZONE_ALIASES };
  const sorted = Object.keys(allAliases).sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    if (lower.includes(alias)) return allAliases[alias];
  }
  return undefined;
}

function detectZoneFromUrl(url: string): string | undefined {
  const lower = url.toLowerCase();
  const sorted = Object.keys(ZONE_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    if (lower.includes(alias)) return ZONE_ALIASES[alias];
  }
  return undefined;
}

function parseNumber(s: string): number {
  return parseInt(s.replace(/\./g, "").replace(/,/g, ""), 10);
}

function parseListing(text: string, url: string): ScrapedListing {
  const result: ScrapedListing = { city: "barcelona" };

  // Price: handles "1.200 €/mes", "1200 €/mes", "1.200 € al mes", "1200€/mes"
  const priceMatch = text.match(
    /(\d[\d.]*)\s*€\s*(?:\/\s*mes|al\s+mes|\/\s*month|\s+mes)/i
  );
  if (priceMatch) {
    const v = parseNumber(priceMatch[1]);
    if (v > 100 && v < 20000) result.price_monthly = v;
  }

  // Surface area: first reasonable "XX m²" value
  for (const m of text.matchAll(/(\d+)\s*m[²2²]/gi)) {
    const v = parseInt(m[1], 10);
    if (v >= 20 && v <= 600) {
      result.sqm = v;
      break;
    }
  }

  // Bedrooms
  const bedMatch =
    text.match(/(\d+)\s*habitacion(?:es)?/i) ||
    text.match(/(\d+)\s*hab\.?(?:\s|,)/i) ||
    text.match(/(\d+)\s*dormitorio/i) ||
    text.match(/(\d+)\s*bedroom/i);
  if (bedMatch) result.bedrooms = Math.min(parseInt(bedMatch[1], 10), 5);

  // Bathrooms
  const bathMatch =
    text.match(/(\d+)\s*ba[ñn]os?/i) || text.match(/(\d+)\s*bathroom/i);
  if (bathMatch) result.bathrooms = Math.min(parseInt(bathMatch[1], 10), 3);

  // Floor
  const floorMatch =
    text.match(/(\d+)[aª°]\s*planta/i) ||
    text.match(/planta\s*(\d+)/i) ||
    text.match(/(\d+)(?:st|nd|rd|th)?\s*floor/i);
  if (floorMatch) result.floor = Math.min(parseInt(floorMatch[1], 10), 10);
  else if (/\bplanta\s*baja\b|\bbajo\b/i.test(text)) result.floor = 0;

  // Boolean features
  if (/\bascensor\b/i.test(text)) result.has_elevator = true;
  if (/\bterraza\b|\bbalc[oó]n\b/i.test(text)) result.has_terrace = true;
  if (/\bamueblad[oa]\b|\bcon\s+muebles\b/i.test(text)) result.furnished = true;

  // Zone: try text content first, then URL
  result.zone_name = detectZoneFromText(text) ?? detectZoneFromUrl(url);

  return result;
}

function extractMetaContent(html: string, ...names: string[]): string {
  for (const name of names) {
    // property="..." or name="..."
    const m =
      html.match(
        new RegExp(
          `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`,
          "i"
        )
      ) ||
      html.match(
        new RegExp(
          `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`,
          "i"
        )
      );
    if (m?.[1]) return m[1];
  }
  return "";
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const m = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/** Strategy 1: Direct fetch — works for sites without aggressive bot detection */
async function fetchDirectHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html")) return null;
    const text = await res.text();
    // Discard Cloudflare challenge pages
    if (
      text.includes("cf-browser-verification") ||
      text.includes("challenge-platform") ||
      text.includes("Just a moment")
    )
      return null;
    return text;
  } catch {
    return null;
  }
}

/** Strategy 2: Jina AI Reader — renders JS and handles bot protection */
async function fetchViaJina(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Accept: "application/json",
        "X-Return-Format": "markdown",
        "Accept-Language": "es-ES,es;q=0.9",
      },
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;

    // Try JSON response first (richer)
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const json = await res.json();
      const content = json?.data?.content ?? json?.content ?? "";
      if (typeof content === "string" && content.length > 50) return content;
      return null;
    }

    const text = await res.text();
    if (text.length < 50) return null;
    // Discard Jina error pages
    if (text.includes("Just a moment") || text.includes("Access denied"))
      return null;
    return text;
  } catch {
    return null;
  }
}

/** Parse HTML (direct fetch): JSON-LD + meta description + body text */
function parseFromHtml(html: string, url: string): ScrapedListing {
  // 1. Try JSON-LD structured data
  const jsonLd = extractJsonLd(html);
  if (jsonLd) {
    const ld = jsonLd as Record<string, unknown>;
    const partial: ScrapedListing = { city: "barcelona" };

    const floor = ld["floorSize"] as Record<string, unknown> | undefined;
    if (floor?.value) partial.sqm = Number(floor.value);

    const rooms = ld["numberOfRooms"];
    if (rooms) partial.bedrooms = Math.min(Number(rooms), 5);

    const bathrooms = ld["numberOfBathroomsTotal"] ?? ld["numberOfBathrooms"];
    if (bathrooms) partial.bathrooms = Math.min(Number(bathrooms), 3);

    if (partial.sqm || partial.bedrooms) {
      // Get price + zone from meta description fallback
      const desc = extractMetaContent(
        html,
        "og:description",
        "description",
        "twitter:description"
      );
      const fromDesc = parseListing(desc, url);
      return { ...fromDesc, ...partial };
    }
  }

  // 2. Combine title + description for parsing
  const title = extractMetaContent(html, "og:title", "twitter:title") || "";
  const desc =
    extractMetaContent(
      html,
      "og:description",
      "description",
      "twitter:description"
    ) || "";

  const combined = [title, desc].join(" ");
  if (combined.length > 20) return parseListing(combined, url);

  return { city: "barcelona" };
}

function countFields(l: ScrapedListing): number {
  return Object.values(l).filter((v) => v !== undefined && v !== "barcelona")
    .length;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Always extract what we can from the URL structure itself (fast, free)
  const urlZone = detectZoneFromUrl(url);
  const basePartial: ScrapedListing = {
    city: "barcelona",
    ...(urlZone ? { zone_name: urlZone } : {}),
  };

  // Strategy 1: Direct HTML fetch
  const html = await fetchDirectHtml(url);
  if (html && html.length > 500) {
    const listing = parseFromHtml(html, url);
    const merged = { ...basePartial, ...listing };
    if (countFields(merged) >= 2) {
      return NextResponse.json(merged);
    }
  }

  // Strategy 2: Jina AI Reader
  const jinaText = await fetchViaJina(url);
  if (jinaText) {
    const listing = parseListing(jinaText, url);
    const merged = { ...basePartial, ...listing };
    if (countFields(merged) >= 2) {
      return NextResponse.json(merged);
    }
  }

  // Strategy 3: Return URL-extracted partial (zone at least)
  if (urlZone) {
    return NextResponse.json(basePartial);
  }

  // All strategies exhausted
  return NextResponse.json(
    {
      error:
        "No se pudo leer el anuncio automáticamente (el portal bloquea el acceso). Introduce los datos manualmente.",
    },
    { status: 422 }
  );
}
