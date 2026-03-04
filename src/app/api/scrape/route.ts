import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedListing } from "@/lib/scraper/urlParser";

// ─── Zone detection from URL slug ──────────────────────────────────────────

const ZONE_SLUG_MAP: Record<string, string> = {
  "l-eixample": "Eixample",
  eixample: "Eixample",
  gracia: "Gràcia",
  "vila-de-gracia": "Gràcia",
  "vila-de-gràcia": "Gràcia",
  sants: "Sants",
  "sants-montjuic": "Sants",
  montjuic: "Sants",
  "sant-marti": "Sant Martí",
  "sant-martí": "Sant Martí",
  poblenou: "Sant Martí",
  "diagonal-mar": "Sant Martí",
  "el-clot": "Sant Martí",
  "ciudad-vella": "Ciutat Vella",
  "ciutat-vella": "Ciutat Vella",
  gothic: "Ciutat Vella",
  raval: "Ciutat Vella",
  born: "Ciutat Vella",
  barceloneta: "Ciutat Vella",
  sarria: "Sarrià",
  "sant-gervasi": "Sarrià",
  pedralbes: "Les Corts",
  "les-corts": "Les Corts",
  horta: "Horta",
  "horta-guinardo": "Horta",
  guinardo: "Horta",
  "nou-barris": "Nou Barris",
  roquetes: "Nou Barris",
  "sant-andreu": "Sant Andreu",
  sagrera: "Sant Andreu",
};

function detectZoneFromUrl(url: string): string | undefined {
  const lower = url.toLowerCase();
  const sorted = Object.keys(ZONE_SLUG_MAP).sort((a, b) => b.length - a.length);
  for (const slug of sorted) {
    if (lower.includes(slug)) return ZONE_SLUG_MAP[slug];
  }
  return undefined;
}

// ─── Fetch strategies ───────────────────────────────────────────────────────

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
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html")) return null;
    const html = await res.text();
    // Discard Cloudflare challenge pages
    if (
      html.includes("cf-browser-verification") ||
      html.includes("challenge-platform") ||
      html.includes("Just a moment")
    )
      return null;
    return html;
  } catch {
    return null;
  }
}

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

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const json = await res.json();
      const content = json?.data?.content ?? json?.content ?? "";
      if (typeof content === "string" && content.length > 100) return content;
      return null;
    }
    const text = await res.text();
    if (text.length < 100) return null;
    if (text.includes("Just a moment") || text.includes("Access denied"))
      return null;
    return text;
  } catch {
    return null;
  }
}

// Extract useful text from HTML: meta tags + JSON-LD + strip tags
function extractTextFromHtml(html: string): string {
  const parts: string[] = [];

  // og:title, og:description, name="description"
  const metas = [
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1],
    ...["og:title", "og:description", "description", "twitter:description"].map(
      (name) =>
        html.match(
          new RegExp(
            `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']{10,})["']`,
            "i"
          )
        )?.[1] ||
        html.match(
          new RegExp(
            `<meta[^>]+content=["']([^"']{10,})["'][^>]+(?:property|name)=["']${name}["']`,
            "i"
          )
        )?.[1]
    ),
  ].filter(Boolean);
  parts.push(...(metas as string[]));

  // JSON-LD
  const jsonLdMatch = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (jsonLdMatch) parts.push(jsonLdMatch[1]);

  // Strip HTML tags from a section of body (first 8000 chars)
  const body = html.slice(0, 40000).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  parts.push(body.slice(0, 3000));

  return parts.join("\n").slice(0, 6000);
}

// ─── AI extraction via Claude Haiku ────────────────────────────────────────

const VALID_ZONES = [
  "Eixample",
  "Gràcia",
  "Sants",
  "Sant Martí",
  "Ciutat Vella",
  "Sarrià",
  "Les Corts",
  "Horta",
  "Nou Barris",
  "Sant Andreu",
];

const SYSTEM_PROMPT = `You are a data extraction assistant for a Spanish rental price tool.
Given text from a property listing page, extract the fields below as a JSON object.
Only include fields you are confident about. Omit uncertain ones.

Fields:
- price_monthly: monthly rent in euros (number, no currency symbol)
- sqm: surface area in m² (number, 20–600)
- bedrooms: number of bedrooms (integer 1–5)
- bathrooms: number of bathrooms (integer 1–3)
- floor: floor number (integer: 0 = ground/bajo, 1–10)
- has_elevator: building has elevator (boolean)
- has_terrace: apartment has terrace or balcony (boolean)
- furnished: apartment is furnished (boolean)
- zone_name: Barcelona neighborhood — MUST be exactly one of: ${VALID_ZONES.join(", ")}

Return ONLY a valid JSON object, no markdown, no explanation.`;

async function extractWithAI(text: string): Promise<ScrapedListing | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";
    if (!raw) return null;

    // Strip markdown code fences if present
    const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(json) as Record<string, unknown>;

    const listing: ScrapedListing = { city: "barcelona" };

    if (typeof parsed.price_monthly === "number" && parsed.price_monthly > 100)
      listing.price_monthly = parsed.price_monthly;
    if (typeof parsed.sqm === "number" && parsed.sqm >= 20)
      listing.sqm = parsed.sqm;
    if (typeof parsed.bedrooms === "number")
      listing.bedrooms = Math.min(parsed.bedrooms, 5);
    if (typeof parsed.bathrooms === "number")
      listing.bathrooms = Math.min(parsed.bathrooms, 3);
    if (typeof parsed.floor === "number")
      listing.floor = Math.min(Math.max(parsed.floor, 0), 10);
    if (typeof parsed.has_elevator === "boolean")
      listing.has_elevator = parsed.has_elevator;
    if (typeof parsed.has_terrace === "boolean")
      listing.has_terrace = parsed.has_terrace;
    if (typeof parsed.furnished === "boolean")
      listing.furnished = parsed.furnished;
    if (
      typeof parsed.zone_name === "string" &&
      VALID_ZONES.includes(parsed.zone_name)
    )
      listing.zone_name = parsed.zone_name;

    return listing;
  } catch {
    return null;
  }
}

// ─── Regex fallback ─────────────────────────────────────────────────────────

function parseWithRegex(text: string, url: string): ScrapedListing {
  const result: ScrapedListing = { city: "barcelona" };
  const lower = text.toLowerCase();

  const priceMatch = text.match(
    /(\d[\d.]*)\s*€\s*(?:\/\s*mes|al\s+mes|\/\s*month|\s+mes)/i
  );
  if (priceMatch) {
    const v = parseInt(priceMatch[1].replace(/\./g, ""), 10);
    if (v > 100 && v < 20000) result.price_monthly = v;
  }

  for (const m of text.matchAll(/(\d+)\s*m[²2]/gi)) {
    const v = parseInt(m[1], 10);
    if (v >= 20 && v <= 600) { result.sqm = v; break; }
  }

  const bedMatch =
    text.match(/(\d+)\s*habitacion(?:es)?/i) ||
    text.match(/(\d+)\s*hab\.?\b/i) ||
    text.match(/(\d+)\s*dormitorio/i);
  if (bedMatch) result.bedrooms = Math.min(parseInt(bedMatch[1], 10), 5);

  const bathMatch = text.match(/(\d+)\s*ba[ñn]os?/i);
  if (bathMatch) result.bathrooms = Math.min(parseInt(bathMatch[1], 10), 3);

  const floorMatch =
    text.match(/(\d+)[aª°]\s*planta/i) || text.match(/planta\s*(\d+)/i);
  if (floorMatch) result.floor = Math.min(parseInt(floorMatch[1], 10), 10);
  else if (/planta baja|bajo\b/i.test(text)) result.floor = 0;

  if (/\bascensor\b/i.test(lower)) result.has_elevator = true;
  if (/\bterraza\b|\bbalc[oó]n\b/i.test(lower)) result.has_terrace = true;
  if (/\bamueblad[oa]\b/i.test(lower)) result.furnished = true;

  result.zone_name = detectZoneFromUrl(url);
  return result;
}

// ─── Route ──────────────────────────────────────────────────────────────────

function countFields(l: ScrapedListing): number {
  return Object.values(l).filter(
    (v) => v !== undefined && v !== "barcelona"
  ).length;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Step 1: Fetch page content via direct HTML or Jina
  let pageText: string | null = null;

  const html = await fetchDirectHtml(url);
  if (html && html.length > 500) {
    pageText = extractTextFromHtml(html);
  }

  if (!pageText || pageText.length < 200) {
    const jinaText = await fetchViaJina(url);
    if (jinaText) pageText = jinaText;
  }

  // Step 2: Extract data — AI first, regex as fallback
  let listing: ScrapedListing | null = null;

  if (pageText) {
    // Try AI extraction
    listing = await extractWithAI(pageText);

    // Fallback to regex if AI failed or returned too little
    if (!listing || countFields(listing) < 2) {
      const regexResult = parseWithRegex(pageText, url);
      listing = listing
        ? { ...regexResult, ...listing } // merge: AI wins on overlap
        : regexResult;
    }
  }

  // Step 3: Always try zone from URL as last resort
  const urlZone = detectZoneFromUrl(url);
  if (urlZone && !listing?.zone_name) {
    listing = { ...(listing ?? {}), city: "barcelona", zone_name: urlZone };
  }

  if (!listing || countFields(listing) === 0) {
    return NextResponse.json(
      {
        error:
          "No se pudo leer el anuncio. El portal bloquea el acceso automatizado. Introduce los datos manualmente.",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ city: "barcelona", ...listing });
}
