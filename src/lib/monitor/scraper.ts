import { parse } from "node-html-parser";

export interface SelectorConfig {
  container: string;
  title: string;
  price: string;
  sqm: string;
  bedrooms: string;
  link: string;
  image?: string;
}

export interface ScrapedItem {
  url: string;
  title: string | null;
  price_monthly: number | null;
  sqm: number | null;
  bedrooms: number | null;
  image_url: string | null;
  raw_snippet: string;
}

function extractNumber(text: string | undefined | null): number | null {
  if (!text) return null;
  const match = text.replace(/[.,]/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function resolveUrl(href: string | undefined | null, baseUrl: string): string | null {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

export async function scrapeAgency(
  listingUrl: string,
  config: SelectorConfig
): Promise<ScrapedItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(listingUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RentCheckBot/1.0; +https://rentcheck.app)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "es-ES,es;q=0.9",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const root = parse(html);
    const containers = root.querySelectorAll(config.container);

    return containers.slice(0, 50).map((el) => {
      const titleEl = el.querySelector(config.title);
      const priceEl = el.querySelector(config.price);
      const sqmEl = el.querySelector(config.sqm);
      const bedsEl = el.querySelector(config.bedrooms);
      const linkEl = el.querySelector(config.link);
      const imgEl = config.image ? el.querySelector(config.image) : null;

      const href = linkEl?.getAttribute("href") ?? linkEl?.getAttribute("data-href");
      const url = resolveUrl(href, listingUrl);
      if (!url) return null;

      return {
        url,
        title: titleEl?.text?.trim() ?? null,
        price_monthly: extractNumber(priceEl?.text),
        sqm: extractNumber(sqmEl?.text),
        bedrooms: extractNumber(bedsEl?.text),
        image_url: imgEl?.getAttribute("src") ?? imgEl?.getAttribute("data-src") ?? null,
        raw_snippet: el.innerHTML.slice(0, 500),
      } satisfies ScrapedItem;
    }).filter((item): item is ScrapedItem => item !== null && Boolean(item.url));
  } finally {
    clearTimeout(timeout);
  }
}
