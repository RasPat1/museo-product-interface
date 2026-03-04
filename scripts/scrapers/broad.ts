import type { ScrapedExhibit, ScraperResult } from './types';
import { fetchHtml, loadHtml } from './utils';

const BASE_URL = 'https://www.thebroad.org';
const ART_URL = `${BASE_URL}/art`;

export function parseBroadExhibitions(html: string): ScrapedExhibit[] {
  const $ = loadHtml(html);
  const exhibits: ScrapedExhibit[] = [];

  // Cards are inside .now-on-view and .upcoming-exhibitions sections
  $('.now-on-view a.card-main, .upcoming-exhibitions a.card-main').each((_, el) => {
    const $el = $(el);
    const type = $el.find('.text-cta').text().trim();

    // Only include "Special Exhibition" — skip "Featured Installation", "Featured Artwork"
    if (!/special exhibition/i.test(type)) return;

    const title = $el.find('.card-main__heading').text().trim();
    if (!title) return;

    const href = $el.attr('href');
    const url = href ? (href.startsWith('http') ? href : `${BASE_URL}${href}`) : null;

    const imgSrc = $el.find('.card-main__image img').attr('src') || null;

    exhibits.push({
      title,
      description: '',
      startDate: null,
      endDate: null,
      imageUrl: imgSrc,
      category: 'Contemporary Art',
      url,
    });
  });

  return exhibits;
}

export async function scrape(): Promise<ScraperResult> {
  const errors: string[] = [];
  try {
    const html = await fetchHtml(ART_URL);
    const exhibits = parseBroadExhibitions(html);
    return { museumId: 'broad', exhibits, errors };
  } catch (err) {
    errors.push(`Broad fetch failed: ${err}`);
    return { museumId: 'broad', exhibits: [], errors };
  }
}
