import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

interface DebugResults {
  config: Record<string, string>;
  tests: Record<string, unknown>;
}

// Quick diagnostic: checks which services are configured and tests them
export async function GET(req: NextRequest) {
  const url =
    req.nextUrl.searchParams.get("url") ??
    "https://www.idealista.com/inmueble/110463662/";

  const scrapingBeeKey = process.env.SCRAPINGBEE_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const jinaKey = process.env.JINA_API_KEY;

  const results: DebugResults = {
    config: {
      scrapingBee: scrapingBeeKey ? `set (${scrapingBeeKey.slice(0, 8)}...)` : "NOT SET",
      firecrawl: firecrawlKey ? `set (${firecrawlKey.slice(0, 8)}...)` : "NOT SET",
      jina: jinaKey ? `set (${jinaKey.slice(0, 8)}...)` : "not set (optional)",
    },
    tests: {},
  };

  // Test ScrapingBee with premium proxy (required for Idealista)
  if (scrapingBeeKey) {
    try {
      const params = new URLSearchParams({
        api_key: scrapingBeeKey,
        url,
        render_js: "true",
        premium_proxy: "true",
        block_resources: "false",
        wait: "5000",
      });
      const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`, {
        signal: AbortSignal.timeout(30000),
      });
      const body = await res.text();
      results.tests.scrapingBee = {
        status: res.status,
        htmlLength: body.length,
        isCloudflare:
          body.includes("Just a moment") || body.includes("cf-browser-verification"),
        preview: body.slice(0, 300),
      };
    } catch (e) {
      results.tests.scrapingBee = { error: String(e) };
    }
  }

  // Test Jina (free, no key needed)
  try {
    const headers: Record<string, string> = {
      Accept: "text/plain",
      "X-Return-Format": "markdown",
    };
    if (jinaKey) headers["Authorization"] = `Bearer ${jinaKey}`;
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers,
      signal: AbortSignal.timeout(20000),
    });
    const body = await res.text();
    results.tests.jina = {
      status: res.status,
      contentLength: body.length,
      isBlocked: body.includes("Just a moment") || body.includes("Access denied"),
      preview: body.slice(0, 300),
    };
  } catch (e) {
    results.tests.jina = { error: String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
