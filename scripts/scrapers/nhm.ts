import type { ScrapedExhibit, ScraperResult } from './types';
import { fetchHtml, loadHtml } from './utils';

const BASE_URL = 'https://nhm.org';
const EXHIBITIONS_URL = `${BASE_URL}/experience-nhm/exhibitions-natural-history-museum`;

export function parseNhmExhibitions(html: string): ScrapedExhibit[] {
  const $ = loadHtml(html);
  const exhibits: ScrapedExhibit[] = [];

  // Each exhibition is a teaser card link
  $('a.bc-c-teaser-card').each((_, el) => {
    const $el = $(el);

    const type = $el.find('.bc-f-h6').first().text().trim();

    // Skip "Ongoing Exhibition" — only keep "Special Exhibition"
    if (!/special exhibition/i.test(type)) return;

    const title = $el.find('.bc-c-teaser-card__title span').text().trim();
    if (!title) return;

    const href = $el.attr('href');
    const url = href ? (href.startsWith('http') ? href : `${BASE_URL}${href}`) : null;

    // Get image from picture > source or img
    const imgSrc =
      $el.find('picture source[media="(min-width: 640px)"]').attr('data-srcset') ||
      $el.find('picture img').attr('data-src') ||
      $el.find('picture img').attr('src') ||
      null;

    exhibits.push({
      title,
      description: '',
      startDate: null,
      endDate: null,
      imageUrl: imgSrc,
      category: 'Natural History',
      url,
    });
  });

  return exhibits;
}

export async function scrape(): Promise<ScraperResult> {
  const errors: string[] = [];
  try {
    const html = await fetchHtml(EXHIBITIONS_URL);
    const exhibits = parseNhmExhibitions(html);
    return { museumId: 'nhm', exhibits, errors };
  } catch (err) {
    errors.push(`NHM fetch failed: ${err}`);
    return { museumId: 'nhm', exhibits: [], errors };
  }
}
