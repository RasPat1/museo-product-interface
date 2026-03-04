import type { ScrapedExhibit, ScraperResult } from './types';
import { fetchHtml, loadHtml } from './utils';

const BASE_URL = 'https://www.metmuseum.org';
const EXHIBITIONS_URL = `${BASE_URL}/exhibitions`;

interface MetListing {
  title: string;
  url: string;
  startDate: string | null;
  endDate: string | null;
  imageUrl: string | null;
}

export interface MetDetailInfo {
  locationName: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string;
}

const MONTHS: Record<string, string> = {
  january: '01', jan: '01', february: '02', feb: '02',
  march: '03', mar: '03', april: '04', apr: '04',
  may: '05', june: '06', jun: '06', july: '07', jul: '07',
  august: '08', aug: '08', september: '09', sep: '09', sept: '09',
  october: '10', oct: '10', november: '11', nov: '11',
  december: '12', dec: '12',
};

/**
 * Parse Met date formats which may omit the year:
 *   "Through April 5"
 *   "June 7–September 27, 2026"
 *   "March 16, 2026–May 9, 2027"
 */
export function parseMetDateRange(text: string): { startDate: string | null; endDate: string | null } {
  if (!text) return { startDate: null, endDate: null };

  const normalized = text.trim();

  // "Through Month Day" or "Through Month Day, Year"
  const throughMatch = normalized.match(/(?:now\s+)?through\s+(\w+)\s+(\d{1,2})(?:,?\s*(\d{4}))?/i);
  if (throughMatch) {
    const month = MONTHS[throughMatch[1].toLowerCase()];
    if (month) {
      const day = throughMatch[2].padStart(2, '0');
      const year = throughMatch[3] || new Date().getFullYear().toString();
      return { startDate: null, endDate: `${year}-${month}-${day}` };
    }
  }

  // Split on dash/en-dash/em-dash
  const parts = normalized.split(/\s*[\u2013\u2014\-–—]\s*/);
  if (parts.length === 2) {
    // Try to find a year in the second part
    const endMatch = parts[1].match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/);
    const startMatch = parts[0].match(/(\w+)\s+(\d{1,2})(?:,?\s*(\d{4}))?/);

    let endDate: string | null = null;
    let endYear: string | null = null;

    if (endMatch) {
      const month = MONTHS[endMatch[1].toLowerCase()];
      if (month) {
        const day = endMatch[2].padStart(2, '0');
        endYear = endMatch[3] || new Date().getFullYear().toString();
        endDate = `${endYear}-${month}-${day}`;
      }
    }

    let startDate: string | null = null;
    if (startMatch) {
      const month = MONTHS[startMatch[1].toLowerCase()];
      if (month) {
        const day = startMatch[2].padStart(2, '0');
        // Use explicit year if present, otherwise infer from end date year
        const year = startMatch[3] || endYear || new Date().getFullYear().toString();
        startDate = `${year}-${month}-${day}`;
      }
    }

    return { startDate, endDate };
  }

  return { startDate: null, endDate: null };
}

/**
 * Parse the Met exhibitions listing page to extract titles, URLs, and dates
 * from the "featured" and "upcoming" sections (skipping ongoing and past).
 */
export function parseMetListings(html: string): MetListing[] {
  const $ = loadHtml(html);
  const listings: MetListing[] = [];
  const seen = new Set<string>();

  $('#featured article, #upcoming article').each((_, el) => {
    const $el = $(el);

    // Find exhibition link
    const $link = $el.find('a[href^="/exhibitions/"]').filter((_, a) =>
      $(a).text().trim().length > 0
    ).first();

    const title = $link.text().trim();
    const href = $link.attr('href');
    if (!title || !href) return;

    // Deduplicate
    if (seen.has(href)) return;
    seen.add(href);

    const url = `${BASE_URL}${href}`;

    // Date text is in the last div inside the card's meta area
    const allText = $el.text().replace(/\s+/g, ' ').trim();
    const dateText = allText.replace(title, '').trim();

    const { startDate, endDate } = parseMetDateRange(dateText);

    // Extract image from the card
    const imageUrl = $el.find('img').attr('src') || null;

    listings.push({ title, url, startDate, endDate, imageUrl });
  });

  return listings;
}

/**
 * Parse a Met exhibition detail page to extract location and metadata
 * from JSON-LD structured data.
 */
export function parseMetDetailPage(html: string): MetDetailInfo {
  const result: MetDetailInfo = {
    locationName: null,
    startDate: null,
    endDate: null,
    description: '',
  };

  const $ = loadHtml(html);

  // Extract description from main content paragraphs
  const paragraphs: string[] = [];
  $('[class*="content-split-module"] p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 0) {
      paragraphs.push(text);
    }
  });
  result.description = paragraphs.join('\n\n');

  const ldJsonRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = ldJsonRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'ExhibitionEvent') {
        result.locationName = data.location?.name || null;

        if (data.startDate) {
          result.startDate = data.startDate.substring(0, 10);
        }
        if (data.endDate) {
          result.endDate = data.endDate.substring(0, 10);
        }
        break;
      }
    } catch {
      // skip malformed JSON-LD
    }
  }

  return result;
}

function museumIdForLocation(locationName: string | null): string {
  if (locationName === 'The Met Cloisters') return 'met-cloisters';
  return 'met';
}

export async function scrape(): Promise<ScraperResult[]> {
  const errors: string[] = [];
  const metExhibits: ScrapedExhibit[] = [];
  const cloistersExhibits: ScrapedExhibit[] = [];

  try {
    const listingHtml = await fetchHtml(EXHIBITIONS_URL);
    const listings = parseMetListings(listingHtml);

    // Fetch each detail page to get location and description
    const detailPromises = listings.map(async (listing) => {
      try {
        const detailHtml = await fetchHtml(listing.url);
        const detail = parseMetDetailPage(detailHtml);

        const exhibit: ScrapedExhibit = {
          title: listing.title,
          description: detail.description,
          startDate: detail.startDate || listing.startDate,
          endDate: detail.endDate || listing.endDate,
          imageUrl: listing.imageUrl,
          category: null,
          url: listing.url,
        };

        const museumId = museumIdForLocation(detail.locationName);
        if (museumId === 'met-cloisters') {
          cloistersExhibits.push(exhibit);
        } else {
          metExhibits.push(exhibit);
        }
      } catch (err) {
        errors.push(`Met detail fetch failed for "${listing.title}": ${err}`);

        // Fall back to listing data, assign to main Met
        metExhibits.push({
          title: listing.title,
          description: '',
          startDate: listing.startDate,
          endDate: listing.endDate,
          imageUrl: listing.imageUrl,
          category: null,
          url: listing.url,
        });
      }
    });

    await Promise.all(detailPromises);
  } catch (err) {
    errors.push(`Met listing fetch failed: ${err}`);
  }

  return [
    { museumId: 'met', exhibits: metExhibits, errors },
    { museumId: 'met-cloisters', exhibits: cloistersExhibits, errors: [] },
  ];
}
