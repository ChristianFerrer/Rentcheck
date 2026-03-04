// URL parser — attempts to extract listing data from known portals.
// In a full production app this would call a headless browser / scraping service.
// For the MVP we return null to fall back to manual input.

export interface ScrapedListing {
  price_monthly?: number;
  sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  zone_name?: string;
  city?: string;
  floor?: number;
  has_elevator?: boolean;
  has_terrace?: boolean;
  furnished?: boolean;
}

function detectPortal(url: string): string | null {
  if (url.includes("idealista.com")) return "idealista";
  if (url.includes("fotocasa.es")) return "fotocasa";
  if (url.includes("habitaclia.com")) return "habitaclia";
  if (url.includes("pisos.com")) return "pisos";
  return null;
}

export async function parseListingUrl(
  url: string
): Promise<ScrapedListing | null> {
  try {
    const portal = detectPortal(url);
    if (!portal) return null;

    // In a real implementation we would:
    // 1. Call a scraping microservice or Puppeteer endpoint
    // 2. Parse the HTML for structured data (JSON-LD, meta tags)
    // 3. Return extracted fields

    // For MVP: return null so the UI falls back to manual form
    return null;
  } catch {
    return null;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isSupportedPortal(url: string): boolean {
  return detectPortal(url) !== null;
}
