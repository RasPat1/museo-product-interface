import type { ScrapedExhibit, ScraperResult } from './types';
import { fetchHtml } from './utils';

const EXHIBITIONS_URL = 'https://www.getty.edu/exhibitions/';

interface JsonLdExhibition {
  '@type': string;
  name: string;
  description?: string;
  about?: string;
  startDate?: string;
  endDate?: string;
  url?: string;
}

export function parseGettyExhibitions(html: string): ScrapedExhibit[] {
  const exhibits: ScrapedExhibit[] = [];
  const ldJsonRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = ldJsonRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      findExhibitions(data, exhibits);
    } catch {
      // skip malformed JSON-LD blocks
    }
  }

  return exhibits;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findExhibitions(obj: any, results: ScrapedExhibit[]): void {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) findExhibitions(item, results);
    return;
  }

  if (obj['@type'] === 'ExhibitionEvent' && obj.name) {
    results.push({
      title: obj.name,
      description: obj.description || obj.about || '',
      startDate: obj.startDate || null,
      endDate: obj.endDate || null,
      imageUrl: null,
      category: null,
      url: obj.url || null,
    });
    return;
  }

  // Recurse into nested objects (mainEntity, itemListElement, etc.)
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      findExhibitions(value, results);
    }
  }
}

export async function scrape(): Promise<ScraperResult> {
  const errors: string[] = [];
  try {
    const html = await fetchHtml(EXHIBITIONS_URL);
    const exhibits = parseGettyExhibitions(html);
    return { museumId: 'getty', exhibits, errors };
  } catch (err) {
    errors.push(`Getty fetch failed: ${err}`);
    return { museumId: 'getty', exhibits: [], errors };
  }
}
