import * as cheerio from 'cheerio';

const MONTHS: Record<string, string> = {
  january: '01', jan: '01',
  february: '02', feb: '02',
  march: '03', mar: '03',
  april: '04', apr: '04',
  may: '05',
  june: '06', jun: '06',
  july: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sep: '09', sept: '09',
  october: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12',
};

function parseDate(text: string): string | null {
  text = text.trim();
  // Match "Month Day, Year" or "Month Day Year"
  const match = text.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  if (!month) return null;
  const day = match[2].padStart(2, '0');
  return `${match[3]}-${month}-${day}`;
}

export function parseDateRange(text: string): { startDate: string | null; endDate: string | null } {
  if (!text || /^\s*$/.test(text)) return { startDate: null, endDate: null };

  const normalized = text.trim();

  if (/^ongoing$/i.test(normalized)) {
    return { startDate: null, endDate: null };
  }

  // "Through ..." or "Now through ..."
  const throughMatch = normalized.match(/(?:now\s+)?through\s+(.+)/i);
  if (throughMatch) {
    return { startDate: null, endDate: parseDate(throughMatch[1]) };
  }

  // Split on various dash types
  const parts = normalized.split(/\s*[\u2013\u2014\-–—]\s*/);
  if (parts.length === 2) {
    return {
      startDate: parseDate(parts[0]),
      endDate: parseDate(parts[1]),
    };
  }

  // Single date
  const single = parseDate(normalized);
  if (single) {
    return { startDate: single, endDate: null };
  }

  return { startDate: null, endDate: null };
}

const PERMANENT_KEYWORDS = /\b(permanent|ongoing|always on view|collection highlights)\b/i;

export function isTemporaryExhibit(exhibit: {
  startDate: string | null;
  endDate: string | null;
  title: string;
}): boolean {
  if (!exhibit.endDate) return false;
  if (PERMANENT_KEYWORDS.test(exhibit.title)) return false;

  if (exhibit.startDate && exhibit.endDate) {
    const start = new Date(exhibit.startDate);
    const end = new Date(exhibit.endDate);
    const threeYearsMs = 3 * 365.25 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > threeYearsMs) return false;
  }

  return true;
}

export function generateExhibitId(museumId: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${museumId}-${slug}`;
}

export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.text();
}

export function loadHtml(html: string) {
  return cheerio.load(html);
}
