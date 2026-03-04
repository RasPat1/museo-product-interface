import type { ScrapedExhibit, ScraperResult } from './types';
import { fetchHtml, loadHtml } from './utils';

const BASE_URL = 'https://www.moca.org';
const EXHIBITIONS_URL = `${BASE_URL}/exhibitions`;

export function parseMocaExhibitions(html: string): ScrapedExhibit[] {
  const $ = loadHtml(html);
  const exhibits: ScrapedExhibit[] = [];

  // Grid-based cards (Currently On View, Upcoming sections)
  $('a[href*="/exhibition/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    if (!href || !href.startsWith('/exhibition/')) return;

    const title = $el.find('h2.heading-primary').text().trim();
    if (!title) return;

    // Avoid duplicates (same exhibition may appear in image + text links)
    if (exhibits.some(e => e.title === title)) return;

    const imgSrc = $el.find('img').attr('src') || null;
    const url = `${BASE_URL}${href}`;

    exhibits.push({
      title,
      description: '',
      startDate: null,
      endDate: null,
      imageUrl: imgSrc,
      category: null,
      url,
    });
  });

  // Column article cards (have dates in .label.gray)
  $('article.column-article').each((_, el) => {
    const $el = $(el);
    const link = $el.find('a').attr('href');
    const title = $el.find('h4.heading-primary').text().trim();
    if (!title) return;

    if (exhibits.some(e => e.title === title)) return;

    const dateText = $el.find('.label.gray').text().trim();
    const imgSrc = $el.find('img').attr('src') || null;
    const url = link ? `${BASE_URL}${link}` : null;

    const { startDate, endDate } = parseMocaDateRange(dateText);

    exhibits.push({
      title,
      description: '',
      startDate,
      endDate,
      imageUrl: imgSrc,
      category: null,
      url,
    });
  });

  return exhibits;
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04',
  may: '05', jun: '06', jul: '07', aug: '08',
  sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseMocaDateRange(text: string): { startDate: string | null; endDate: string | null } {
  if (!text) return { startDate: null, endDate: null };

  // Format: "Feb 2026 – Mar 2026" or "Oct 2025 – May 2026"
  const parts = text.split(/\s*[\u2013\u2014–—-]\s*/);
  if (parts.length === 2) {
    return {
      startDate: parseMocaMonthYear(parts[0]),
      endDate: parseMocaMonthYear(parts[1]),
    };
  }
  return { startDate: null, endDate: null };
}

function parseMocaMonthYear(text: string): string | null {
  const match = text.trim().match(/(\w{3})\s+(\d{4})/);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  if (!month) return null;
  return `${match[2]}-${month}-01`;
}

export async function scrape(): Promise<ScraperResult> {
  const errors: string[] = [];
  try {
    const html = await fetchHtml(EXHIBITIONS_URL);
    const exhibits = parseMocaExhibitions(html);
    return { museumId: 'moca', exhibits, errors };
  } catch (err) {
    errors.push(`MOCA fetch failed: ${err}`);
    return { museumId: 'moca', exhibits: [], errors };
  }
}
