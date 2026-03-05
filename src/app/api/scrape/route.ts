import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedListing } from "@/lib/scraper/urlParser";

// Allow up to 60 seconds on Vercel (works on Hobby + Pro)
export const maxDuration = 60;

// ─── Zone detection from URL slug ──────────────────────────────────────────

const ZONE_SLUG_MAP: Record<string, string> = {
  // Eixample barrios
  "la-dreta-de-l-eixample": "La Dreta de l'Eixample",
  "dreta-eixample": "La Dreta de l'Eixample",
  "l-eixample": "La Dreta de l'Eixample",
  eixample: "La Dreta de l'Eixample",
  "sagrada-familia": "La Sagrada Família",
  "sagrada-família": "La Sagrada Família",
  "antiga-esquerra": "L'Antiga Esquerra de l'Eixample",
  "antiga-esquerra-eixample": "L'Antiga Esquerra de l'Eixample",
  "nova-esquerra": "La Nova Esquerra de l'Eixample",
  "nova-esquerra-eixample": "La Nova Esquerra de l'Eixample",
  "sant-antoni": "Sant Antoni",
  "fort-pienc": "El Fort Pienc",
  // Gràcia barrios
  "vila-de-gracia": "Vila de Gràcia",
  "vila-de-gràcia": "Vila de Gràcia",
  gracia: "Vila de Gràcia",
  "camp-grassot": "El Camp d'en Grassot i Gràcia Nova",
  "gracia-nova": "El Camp d'en Grassot i Gràcia Nova",
  "la-salut": "La Salut",
  "el-coll": "El Coll",
  "vallcarca": "Vallcarca i els Penitents",
  // Sarrià-Sant Gervasi
  "sant-gervasi-galvany": "Sant Gervasi - Galvany",
  galvany: "Sant Gervasi - Galvany",
  "sant-gervasi-bonanova": "Sant Gervasi - la Bonanova",
  bonanova: "Sant Gervasi - la Bonanova",
  "tres-torres": "Les Tres Torres",
  "putxet": "El Putxet i el Farró",
  "farró": "El Putxet i el Farró",
  sarria: "Sarrià",
  sarrià: "Sarrià",
  "sant-gervasi": "Sant Gervasi - Galvany",
  vallvidrera: "Vallvidrera, el Tibidabo i les Planes",
  tibidabo: "Vallvidrera, el Tibidabo i les Planes",
  // Sants-Montjuïc
  "poble-sec": "El Poble Sec",
  "el-poble-sec": "El Poble Sec",
  hostafrancs: "Hostafrancs",
  sants: "Sants",
  "sants-badal": "Sants - Badal",
  "sants-montjuic": "Sants",
  "la-bordeta": "La Bordeta",
  "font-guatlla": "La Font de la Guatlla",
  "marina-port": "La Marina de Port",
  "marina-prat-vermell": "La Marina del Prat Vermell",
  montjuic: "Montjuïc",
  montjuïc: "Montjuïc",
  // Les Corts
  "les-corts": "Les Corts",
  pedralbes: "Pedralbes",
  maternitat: "La Maternitat i Sant Ramon",
  // Horta-Guinardó
  "el-guinardo": "El Guinardó",
  guinardo: "El Guinardó",
  guinardó: "El Guinardó",
  "baix-guinardo": "El Baix Guinardó",
  "can-baro": "Can Baró",
  horta: "Horta",
  "horta-guinardo": "Horta",
  carmel: "El Carmel",
  "el-carmel": "El Carmel",
  teixonera: "La Teixonera",
  montbau: "Montbau",
  "vall-hebron": "La Vall d'Hebron",
  // Nou Barris
  vilapicina: "Vilapicina i la Torre Llobeta",
  porta: "Porta",
  "turo-peira": "El Turó de la Peira",
  guineueta: "La Guineueta",
  canyelles: "Canyelles",
  roquetes: "Les Roquetes",
  verdun: "Verdun",
  prosperitat: "La Prosperitat",
  "trinitat-nova": "La Trinitat Nova",
  "torre-baro": "Torre Baró",
  vallbona: "Vallbona",
  "nou-barris": "Vilapicina i la Torre Llobeta",
  "ciutat-meridiana": "Ciutat Meridiana",
  // Sant Andreu
  "sant-andreu": "Sant Andreu",
  "la-sagrera": "La Sagrera",
  sagrera: "La Sagrera",
  "congres": "El Congrés i els Indians",
  navas: "Navas",
  "bon-pastor": "El Bon Pastor",
  "baro-de-viver": "Baró de Viver",
  "trinitat-vella": "La Trinitat Vella",
  // Sant Martí
  poblenou: "El Poblenou",
  "el-poblenou": "El Poblenou",
  "vila-olimpica": "La Vila Olímpica del Poblenou",
  "vila-olímpica": "La Vila Olímpica del Poblenou",
  "diagonal-mar": "Diagonal Mar i el Front Marítim del Poblenou",
  "camp-arpa": "El Camp de l'Arpa del Clot",
  "el-clot": "El Clot",
  clot: "El Clot",
  "parc-llacuna": "El Parc i la Llacuna del Poblenou",
  besos: "El Besòs i el Maresme",
  besòs: "El Besòs i el Maresme",
  provencals: "Provençals del Poblenou",
  "sant-marti": "Sant Martí de Provençals",
  "sant-martí": "Sant Martí de Provençals",
  verneda: "La Verneda i la Pau",
  // Ciutat Vella
  raval: "El Raval",
  "el-raval": "El Raval",
  gothic: "El Barri Gòtic",
  "barri-gotic": "El Barri Gòtic",
  barceloneta: "La Barceloneta",
  born: "Sant Pere, Santa Caterina i la Ribera",
  "sant-pere": "Sant Pere, Santa Caterina i la Ribera",
  ribera: "Sant Pere, Santa Caterina i la Ribera",
  "ciudad-vella": "El Raval",
  "ciutat-vella": "El Raval",
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

// ─── ScrapingBee (primary: handles Cloudflare with real Chrome) ─────────────

async function fetchViaScrapingBee(url: string): Promise<string | null> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    console.log("[ScrapingBee] No API key configured");
    return null;
  }

  // Try without premium_proxy first (5 credits), then with premium (25 credits)
  for (const usePremium of [false, true]) {
    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        url,
        render_js: "true",
        block_resources: "false",
        country_code: "es",
        wait: "2000",
      });
      if (usePremium) params.set("premium_proxy", "true");

      console.log(`[ScrapingBee] Trying ${usePremium ? "premium" : "standard"} proxy`);
      const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`, {
        signal: AbortSignal.timeout(55000),
      });

      console.log(`[ScrapingBee] HTTP ${res.status}`);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.log(`[ScrapingBee] Error body: ${body.slice(0, 200)}`);
        continue;
      }

      const html = await res.text();
      console.log(`[ScrapingBee] HTML length: ${html.length}`);
      if (html.length < 500) continue;
      if (html.includes("Just a moment") || html.includes("cf-browser-verification")) {
        console.log("[ScrapingBee] Cloudflare challenge detected, trying next");
        continue;
      }
      return extractTextFromHtml(html);
    } catch (e) {
      console.log(`[ScrapingBee] Exception (premium=${usePremium}):`, e);
    }
  }
  return null;
}

async function fetchViaFirecrawl(url: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        waitFor: 3000,
        onlyMainContent: false,
        timeout: 40000,
      }),
      signal: AbortSignal.timeout(50000),
    });
    if (!res.ok) {
      console.error("[Firecrawl] HTTP error:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = await res.json();
    if (!json?.success && !json?.data) {
      console.error("[Firecrawl] API error:", JSON.stringify(json));
      return null;
    }
    const markdown = json?.data?.markdown ?? json?.markdown ?? "";
    if (typeof markdown === "string" && markdown.length > 200) return markdown;
    return null;
  } catch (e) {
    console.error("[Firecrawl] Exception:", e);
    return null;
  }
}

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
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Return-Format": "markdown",
      "Accept-Language": "es-ES,es;q=0.9",
    };
    const jinaKey = process.env.JINA_API_KEY;
    if (jinaKey) headers["Authorization"] = `Bearer ${jinaKey}`;

    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers,
      signal: AbortSignal.timeout(35000),
    });
    if (!res.ok) {
      console.error("[Jina] HTTP error:", res.status);
      return null;
    }

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
  } catch (e) {
    console.error("[Jina] Exception:", e);
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

// All 73 Barcelona barrios — LLM must return one of these exact strings
const VALID_ZONES = [
  // Eixample
  "La Dreta de l'Eixample",
  "La Sagrada Família",
  "L'Antiga Esquerra de l'Eixample",
  "La Nova Esquerra de l'Eixample",
  "Sant Antoni",
  "El Fort Pienc",
  // Gràcia
  "Vila de Gràcia",
  "El Camp d'en Grassot i Gràcia Nova",
  "La Salut",
  "El Coll",
  "Vallcarca i els Penitents",
  // Sarrià-Sant Gervasi
  "Sant Gervasi - Galvany",
  "Sant Gervasi - la Bonanova",
  "Les Tres Torres",
  "El Putxet i el Farró",
  "Sarrià",
  "Vallvidrera, el Tibidabo i les Planes",
  // Sants-Montjuïc
  "El Poble Sec",
  "Hostafrancs",
  "Sants",
  "Sants - Badal",
  "La Bordeta",
  "La Font de la Guatlla",
  "La Marina de Port",
  "La Marina del Prat Vermell",
  "Montjuïc",
  // Les Corts
  "Les Corts",
  "La Maternitat i Sant Ramon",
  "Pedralbes",
  // Horta-Guinardó
  "El Guinardó",
  "El Baix Guinardó",
  "Can Baró",
  "Horta",
  "El Carmel",
  "La Font d'en Fargues",
  "La Teixonera",
  "Sant Genís dels Agudells",
  "Montbau",
  "La Vall d'Hebron",
  "La Clota",
  "Can Peguera",
  // Nou Barris
  "Vilapicina i la Torre Llobeta",
  "Porta",
  "El Turó de la Peira",
  "La Guineueta",
  "Canyelles",
  "Les Roquetes",
  "Verdun",
  "La Prosperitat",
  "La Trinitat Nova",
  "Torre Baró",
  "Vallbona",
  "Ciutat Meridiana",
  // Sant Andreu
  "Sant Andreu",
  "La Sagrera",
  "El Congrés i els Indians",
  "Navas",
  "El Bon Pastor",
  "Baró de Viver",
  "La Trinitat Vella",
  // Sant Martí
  "El Poblenou",
  "La Vila Olímpica del Poblenou",
  "Diagonal Mar i el Front Marítim del Poblenou",
  "El Camp de l'Arpa del Clot",
  "El Clot",
  "El Parc i la Llacuna del Poblenou",
  "El Besòs i el Maresme",
  "Provençals del Poblenou",
  "Sant Martí de Provençals",
  "La Verneda i la Pau",
  // Ciutat Vella
  "El Raval",
  "El Barri Gòtic",
  "La Barceloneta",
  "Sant Pere, Santa Caterina i la Ribera",
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

// ─── Shared extraction pipeline ─────────────────────────────────────────────

async function extractFromText(
  pageText: string,
  urlForRegexFallback: string
): Promise<ScrapedListing | null> {
  let listing = await extractWithAI(pageText);

  if (!listing || countFields(listing) < 2) {
    const regexResult = parseWithRegex(pageText, urlForRegexFallback);
    listing = listing
      ? { ...regexResult, ...listing } // merge: AI wins on overlap
      : regexResult;
  }

  return listing;
}

// ─── GET: extract from URL ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Step 1: Race all fetch strategies in parallel — first valid response wins
  const makeTextFetcher = (name: string, fn: () => Promise<string | null>) =>
    fn().then((text) => {
      if (!text || text.length < 200) throw new Error(`${name}: insufficient content`);
      console.log(`[Scrape] ${name} won, length: ${text.length}`);
      return text;
    });

  let pageText: string | null = null;
  try {
    pageText = await Promise.any([
      makeTextFetcher("ScrapingBee", () => fetchViaScrapingBee(url)),
      makeTextFetcher("Firecrawl", () => fetchViaFirecrawl(url)),
      makeTextFetcher("Jina", () => fetchViaJina(url)),
      makeTextFetcher("DirectHTML", async () => {
        const html = await fetchDirectHtml(url);
        return html && html.length > 500 ? extractTextFromHtml(html) : null;
      }),
    ]);
  } catch {
    console.log("[Scrape] All strategies failed");
    pageText = null;
  }

  // Step 2: Extract data
  let listing: ScrapedListing | null = null;
  if (pageText) {
    listing = await extractFromText(pageText, url);
  }

  // Step 3: Zone from URL slug as last resort
  const urlZone = detectZoneFromUrl(url);
  if (urlZone && !listing?.zone_name) {
    listing = { ...(listing ?? {}), city: "barcelona", zone_name: urlZone };
  }

  if (!listing || countFields(listing) === 0) {
    const isDebug = req.nextUrl.searchParams.get("debug") === "1";
    return NextResponse.json(
      {
        error:
          "No se pudo leer el anuncio. El portal bloquea el acceso automatizado. Puedes pegar el texto del anuncio directamente.",
        ...(isDebug && {
          _debug: {
            scrapingBeeConfigured: !!process.env.SCRAPINGBEE_API_KEY,
            firecrawlConfigured: !!process.env.FIRECRAWL_API_KEY,
            jinaConfigured: !!process.env.JINA_API_KEY,
            anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
            pageTextLength: pageText?.length ?? 0,
          },
        }),
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ city: "barcelona", ...listing });
}

// ─── POST: extract from pasted text ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { text?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawText = body.text?.trim() ?? "";
  if (!rawText || rawText.length < 50) {
    return NextResponse.json(
      { error: "El texto pegado es demasiado corto para extraer datos." },
      { status: 400 }
    );
  }

  // Truncate to avoid excessive token usage
  const truncated = rawText.slice(0, 8000);
  const listing = await extractFromText(truncated, body.url ?? "");

  if (!listing || countFields(listing) === 0) {
    return NextResponse.json(
      { error: "No se pudieron extraer datos del texto. Asegúrate de copiar el texto completo del anuncio." },
      { status: 422 }
    );
  }

  return NextResponse.json({ city: "barcelona", ...listing });
}
