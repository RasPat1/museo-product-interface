import type { ScrapedExhibit, ScraperResult } from './types';
import { fetchHtml, loadHtml } from './utils';

const BASE_URL = 'https://www.moma.org';
const EXHIBITIONS_URL = `${BASE_URL}/calendar/exhibitions`;
const WAYBACK_PREFIX = 'https://web.archive.org/web/2026/';

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04',
  may: '05', jun: '06', jul: '07', aug: '08',
  sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04',
  june: '06', july: '07', august: '08', september: '09',
  october: '10', november: '11', december: '12',
};

// Ongoing collection exhibits and permanent installations to exclude
const EXCLUDE_PATTERNS = [
  /^collection\s/i,
  /^art lab/i,
  /^modern mural/i,
];

interface MomaListing {
  id: string;
  title: string;
  dateText: string;
  imageUrl: string | null;
  url: string;
}

/**
 * Parse MoMA date strings into ISO dates.
 * Formats:
 *   "Through Mar 3"
 *   "Through Apr 11"
 *   "Mar 4–May 25, 2026"
 *   "Mar 21–Sep 12, 2026"
 *   "Mar 7–Oct 4, 2026"
 *   "Sep 20, 2026–Spring 2027"
 *   "Nov 14, 2026–Feb 15, 2027"
 *   "Through Spring 2026"
 *   "Through Jul 25"
 */
export function parseMomaDateRange(text: string): { startDate: string | null; endDate: string | null } {
  if (!text) return { startDate: null, endDate: null };

  const normalized = text.replace(/\u00a0/g, ' ').trim();

  if (/^ongoing$/i.test(normalized)) {
    return { startDate: null, endDate: null };
  }

  // Skip vague season-only dates like "Through Spring 2026"
  if (/through\s+(spring|summer|fall|winter)\s+\d{4}/i.test(normalized)) {
    // Approximate: Spring=Jun 1, Summer=Sep 1, Fall=Dec 1, Winter=Mar 1
    const match = normalized.match(/through\s+(spring|summer|fall|winter)\s+(\d{4})/i);
    if (match) {
      const seasonEnds: Record<string, string> = {
        spring: '06-01', summer: '09-01', fall: '12-01', winter: '03-01',
      };
      const end = seasonEnds[match[1].toLowerCase()];
      if (end) return { startDate: null, endDate: `${match[2]}-${end}` };
    }
  }

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
    // Handle same-month ranges like "Aug 8–30, 2026"
    const sameMonthMatch = parts[1].match(/^(\d{1,2}),?\s*(\d{4})$/);
    if (sameMonthMatch) {
      const startMatch = parts[0].match(/(\w+)\s+(\d{1,2})/);
      if (startMatch) {
        const month = MONTHS[startMatch[1].toLowerCase()];
        if (month) {
          const year = sameMonthMatch[2];
          const startDay = startMatch[2].padStart(2, '0');
          const endDay = sameMonthMatch[1].padStart(2, '0');
          return {
            startDate: `${year}-${month}-${startDay}`,
            endDate: `${year}-${month}-${endDay}`,
          };
        }
      }
    }

    // Handle season end dates like "Sep 20, 2026–Spring 2027"
    const seasonMatch = parts[1].match(/^(spring|summer|fall|winter)\s+(\d{4})$/i);
    if (seasonMatch) {
      const seasonEnds: Record<string, string> = {
        spring: '06-01', summer: '09-01', fall: '12-01', winter: '03-01',
      };
      const startDate = parseSingleDate(parts[0], null);
      const end = seasonEnds[seasonMatch[1].toLowerCase()];
      return {
        startDate,
        endDate: end ? `${seasonMatch[2]}-${end}` : null,
      };
    }

    const startDate = parseSingleDate(parts[0], null);
    const endDate = parseSingleDate(parts[1], null);

    // If end has a year but start doesn't, infer start year from end
    if (startDate && endDate && !parts[0].match(/\d{4}/)) {
      const endYear = endDate.substring(0, 4);
      const startMonth = parseInt(startDate.substring(5, 7));
      const endMonth = parseInt(endDate.substring(5, 7));
      // If start month > end month, start is in previous year
      const adjustedYear = startMonth > endMonth
        ? String(parseInt(endYear) - 1)
        : endYear;
      return {
        startDate: `${adjustedYear}${startDate.substring(4)}`,
        endDate,
      };
    }

    return { startDate, endDate };
  }

  const single = parseSingleDate(normalized, null);
  if (single) return { startDate: single, endDate: null };

  return { startDate: null, endDate: null };
}

function parseSingleDate(text: string, fallbackYear: string | null): string | null {
  text = text.trim();

  // "Month Day, Year" or "Month Day Year" or "Month Day"
  const match = text.match(/(\w+)\s+(\d{1,2})(?:,?\s*(\d{4}))?/);
  if (!match) return null;

  const month = MONTHS[match[1].toLowerCase()];
  if (!month) return null;

  const day = match[2].padStart(2, '0');
  const year = match[3] || fallbackYear || new Date().getFullYear().toString();
  return `${year}-${month}-${day}`;
}

/**
 * Parse the MoMA exhibitions listing page.
 * Extracts exhibits from "Current exhibitions", "Upcoming exhibitions",
 * and "Installations and projects" sections.
 */
export function parseMomaListings(html: string): MomaListing[] {
  const $ = loadHtml(html);
  const listings: MomaListing[] = [];
  const seen = new Set<string>();

  $('a[href*="/calendar/exhibitions/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    const idMatch = href.match(/exhibitions\/(\d+)/);
    if (!idMatch) return;

    const id = idMatch[1];
    if (seen.has(id)) return;
    seen.add(id);

    // Extract title from h3 > p elements
    const titleParts: string[] = [];
    $el.find('h3 p').each((_, p) => titleParts.push($(p).text().trim()));

    // Use the first part (which is the full title on small screens) or combine artist + subtitle
    let title = '';
    if (titleParts.length >= 2) {
      // Check if first part is the combined title (contains both parts)
      const combined = titleParts[0];
      const artist = titleParts[titleParts.length - 2];
      const subtitle = titleParts[titleParts.length - 1];
      // The "layout/block @375/layout/none" div has the compact title
      // The "@375/layout/block" div has artist + subtitle separately
      // Use artist: subtitle format for consistency
      if (artist && subtitle && artist !== combined) {
        title = `${artist}: ${subtitle}`;
      } else {
        title = combined || `${artist}: ${subtitle}`;
      }
    } else if (titleParts.length === 1) {
      title = titleParts[0];
    }

    if (!title) {
      title = $el.find('h3').text().trim();
    }
    if (!title) return;

    // Skip excluded patterns
    for (const pattern of EXCLUDE_PATTERNS) {
      if (pattern.test(title)) return;
    }

    // Extract date text - look for p.typography elements that aren't part of the title
    const dateTexts: string[] = [];
    $el.find('div p.typography').each((_, p) => {
      const t = $(p).text().trim();
      if (t && titleParts.indexOf(t) === -1 && t !== 'Last chance') {
        dateTexts.push(t);
      }
    });
    // Use the last date text (the actual date range, not "Member Previews" etc.)
    const dateText = dateTexts[dateTexts.length - 1] || '';

    // Skip ongoing exhibits
    if (/^ongoing$/i.test(dateText) || /ongoing$/i.test(dateText)) return;

    // Extract image URL - get the 1x src from the <img> tag
    let imageUrl: string | null = null;
    const imgSrc = $el.find('img').first().attr('src');
    if (imgSrc) {
      // Remove Wayback Machine prefix if present
      imageUrl = imgSrc.replace(/.*?im_\//, '');
    }

    listings.push({
      id,
      title,
      dateText,
      imageUrl,
      url: `${BASE_URL}/calendar/exhibitions/${id}`,
    });
  });

  return listings;
}

/**
 * Parse a MoMA exhibition detail page to extract description from JSON-LD
 * or meta tags.
 */
export function parseMomaDetailPage(html: string): string {
  const $ = loadHtml(html);

  // Try JSON-LD first
  const ldJsonScripts = $('script[type="application/ld+json"]');
  let description = '';

  ldJsonScripts.each((_, el) => {
    if (description) return;
    try {
      const raw = $(el).html() || '';
      const data = JSON.parse(raw);
      if (data.description) {
        // Remove the "Exhibition. Through Apr 11. " or "Exhibition. Nov 10, 2025–Apr 11, 2026. " prefix
        description = data.description.replace(/^Exhibition\.\s+(?:(?:Through|Now through)\s+\w+\s+\d{1,2}(?:,?\s*\d{4})?|[\w\s,–\-—\u2013\u2014]+?\d{4})\.?\s*/i, '');
      }
    } catch {
      // skip malformed JSON-LD
    }
  });

  // Fall back to meta description
  if (!description) {
    const meta = $('meta[name="description"]').attr('content') || '';
    description = meta.replace(/^Exhibition\.\s+(?:(?:Through|Now through)\s+\w+\s+\d{1,2}(?:,?\s*\d{4})?|[\w\s,–\-—\u2013\u2014]+?\d{4})\.?\s*/i, '');
  }

  // Fall back to first content paragraph
  if (!description) {
    $('section p').each((_, el) => {
      if (description) return;
      const t = $(el).text().trim();
      if (t.length > 50) description = t;
    });
  }

  return description;
}

async function fetchWithWaybackFallback(url: string): Promise<string> {
  try {
    return await fetchHtml(url);
  } catch {
    // Fall back to Wayback Machine
    const waybackUrl = `${WAYBACK_PREFIX}${url}`;
    return await fetchHtml(waybackUrl);
  }
}

export async function scrape(): Promise<ScraperResult> {
  const errors: string[] = [];
  const exhibits: ScrapedExhibit[] = [];

  try {
    const listingHtml = await fetchWithWaybackFallback(EXHIBITIONS_URL);
    const listings = parseMomaListings(listingHtml);

    // Fetch detail pages one at a time to avoid triggering Cloudflare
    for (const listing of listings) {
      const { startDate, endDate } = parseMomaDateRange(listing.dateText);

      let description = '';
      try {
        const detailHtml = await fetchWithWaybackFallback(listing.url);
        description = parseMomaDetailPage(detailHtml);
      } catch (err) {
        errors.push(`MoMA detail fetch failed for "${listing.title}": ${err}`);
      }

      exhibits.push({
        title: listing.title,
        description,
        startDate,
        endDate,
        imageUrl: listing.imageUrl,
        category: 'Modern Art',
        url: listing.url,
      });
    }
  } catch (err) {
    errors.push(`MoMA listing fetch failed: ${err}`);
  }

  return { museumId: 'moma', exhibits, errors };
}
