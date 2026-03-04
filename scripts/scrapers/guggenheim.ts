import type { ScrapedExhibit, ScraperResult } from './types';
import { fetchHtml } from './utils';

const EXHIBITIONS_URL = 'https://www.guggenheim.org/exhibitions';
const BASE_URL = 'https://www.guggenheim.org';

const MONTHS: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
};

interface BootstrapDate {
  day: string;
  month: string;
  year: string;
}

interface BootstrapExhibition {
  title: string;
  slug: string;
  excerpt: string;
  dates: {
    start: BootstrapDate;
    end: BootstrapDate;
    label: string;
  };
  featuredImage: {
    sourceUrl: string;
    altText: string;
  };
}

function parseBootstrapDate(d: BootstrapDate): string | null {
  if (!d || !d.year || !d.month || !d.day) return null;
  const month = MONTHS[d.month.toLowerCase()];
  if (!month) return null;
  const day = d.day.padStart(2, '0');
  return `${d.year}-${month}-${day}`;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

function extractBootstrapJson(html: string): unknown | null {
  const startMarker = 'bootstrap = {';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return null;

  const jsonStart = startIdx + 'bootstrap = '.length;
  let depth = 0;
  let endIdx = jsonStart;
  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  try {
    return JSON.parse(html.substring(jsonStart, endIdx));
  } catch {
    return null;
  }
}

function convertExhibition(item: BootstrapExhibition): ScrapedExhibit {
  const imageUrl = item.featuredImage?.sourceUrl
    ? `${BASE_URL}${item.featuredImage.sourceUrl}`
    : null;

  return {
    title: item.title,
    description: stripHtml(item.excerpt),
    startDate: parseBootstrapDate(item.dates.start),
    endDate: parseBootstrapDate(item.dates.end),
    imageUrl,
    category: null,
    url: `${BASE_URL}/exhibition/${item.slug}`,
  };
}

export function parseGuggenheimExhibitions(html: string): ScrapedExhibit[] {
  const data = extractBootstrapJson(html);
  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const featured = d?.initial?.main?.posts?.featuredExhibitions;
  if (!featured) return [];

  const exhibits: ScrapedExhibit[] = [];

  const sections: BootstrapExhibition[][] = [
    featured.on_view?.items ?? [],
    featured.upcoming?.items ?? [],
  ];

  for (const items of sections) {
    for (const item of items) {
      if (item.dates?.label?.toLowerCase() === 'ongoing') continue;
      exhibits.push(convertExhibition(item));
    }
  }

  return exhibits;
}

export async function scrape(): Promise<ScraperResult> {
  const errors: string[] = [];
  try {
    const html = await fetchHtml(EXHIBITIONS_URL);
    const exhibits = parseGuggenheimExhibitions(html);
    return { museumId: 'guggenheim', exhibits, errors };
  } catch (err) {
    errors.push(`Guggenheim fetch failed: ${err}`);
    return { museumId: 'guggenheim', exhibits: [], errors };
  }
}
