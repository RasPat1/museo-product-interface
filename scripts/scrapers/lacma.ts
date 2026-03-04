import type { ScrapedExhibit, ScraperResult } from './types';
import { fetchHtml, loadHtml } from './utils';

const BASE_URL = 'https://www.lacma.org';
const EXHIBITIONS_URL = `${BASE_URL}/art/exhibitions/current`;

export function parseLacmaExhibitions(html: string): ScrapedExhibit[] {
  const $ = loadHtml(html);
  const exhibits: ScrapedExhibit[] = [];

  $('.views-row').each((_, el) => {
    const $el = $(el);

    const title = $el.find('.views-field-title .field-content a').text().trim();
    if (!title) return;

    const href = $el.find('.views-field-title .field-content a').attr('href');
    const url = href ? `${BASE_URL}${href}` : null;

    const imgSrc = $el.find('.views-field-field-media-image img').attr('src') || null;

    const startDateText = $el.find('.views-field-field-start-date .field-content').text().trim();
    const endDateText = $el.find('.views-field-field-end-date .field-content').text().trim();

    const description = $el.find('.views-field-body .field-content').text().trim();
    const location = $el.find('.views-field-field-location-building .field-content').text().trim();

    // Parse dates — LACMA sometimes omits year on start date
    const startDate = parseLacmaDate(startDateText, endDateText);
    const endDate = parseLacmaDate(endDateText);

    exhibits.push({
      title,
      description,
      startDate,
      endDate,
      imageUrl: imgSrc,
      category: location || null,
      url,
    });
  });

  return exhibits;
}

function parseLacmaDate(text: string, referenceDate?: string): string | null {
  if (!text || /ongoing/i.test(text)) return null;

  // Full date: "July 26, 2026" or "December 21, 2025"
  const fullMatch = text.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (fullMatch) {
    return formatDate(fullMatch[1], fullMatch[2], fullMatch[3]);
  }

  // Date without year: "February 22" — infer year from reference
  const shortMatch = text.match(/(\w+)\s+(\d{1,2})$/);
  if (shortMatch && referenceDate) {
    const refYear = referenceDate.match(/(\d{4})/);
    const year = refYear ? refYear[1] : new Date().getFullYear().toString();
    return formatDate(shortMatch[1], shortMatch[2], year);
  }

  return null;
}

const MONTHS: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
};

function formatDate(month: string, day: string, year: string): string | null {
  const m = MONTHS[month.toLowerCase()];
  if (!m) return null;
  return `${year}-${m}-${day.padStart(2, '0')}`;
}

export function hasMorePages(html: string): boolean {
  const $ = loadHtml(html);
  return $('ul.js-pager__items a[rel="next"]').length > 0;
}

export async function scrape(): Promise<ScraperResult> {
  const errors: string[] = [];
  const allExhibits: ScrapedExhibit[] = [];

  try {
    let page = 0;
    const maxPages = 10; // safety limit

    while (page < maxPages) {
      const url = `${EXHIBITIONS_URL}?page=${page}`;
      const html = await fetchHtml(url);
      const exhibits = parseLacmaExhibitions(html);

      if (exhibits.length === 0) break;
      allExhibits.push(...exhibits);

      if (!hasMorePages(html)) break;
      page++;
    }

    return { museumId: 'lacma', exhibits: allExhibits, errors };
  } catch (err) {
    errors.push(`LACMA fetch failed: ${err}`);
    return { museumId: 'lacma', exhibits: allExhibits, errors };
  }
}
