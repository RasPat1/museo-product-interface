import type { ScrapedExhibit, ScraperResult } from './types';
import { fetchHtml, loadHtml } from './utils';

const EXHIBITS_URL = 'https://californiasciencecenter.org/exhibits';

export function parseCaliforniaScienceExhibitions(html: string): ScrapedExhibit[] {
  const $ = loadHtml(html);
  const exhibits: ScrapedExhibit[] = [];

  // Look for exhibit links/cards — structure may vary
  // The site blocks curl with Cloudflare, so this parser handles
  // the HTML if we get past the challenge (e.g., via Playwright)
  $('a[href*="/exhibits/"]').each((_, el) => {
    const $el = $(el);
    const title = $el.find('h2, h3, h4, .title').text().trim() || $el.text().trim();
    if (!title || title.length > 200) return;

    const href = $el.attr('href');
    const url = href ? (href.startsWith('http') ? href : `https://californiasciencecenter.org${href}`) : null;
    const imgSrc = $el.find('img').attr('src') || null;

    if (exhibits.some(e => e.title === title)) return;

    exhibits.push({
      title,
      description: '',
      startDate: null,
      endDate: null,
      imageUrl: imgSrc,
      category: 'Science',
      url,
    });
  });

  return exhibits;
}

export async function scrape(): Promise<ScraperResult> {
  const errors: string[] = [];

  // Try basic fetch first
  try {
    const html = await fetchHtml(EXHIBITS_URL);
    // Check if we got a Cloudflare challenge page
    if (html.includes('Just a moment') || html.includes('cf-browser-verification')) {
      throw new Error('Cloudflare challenge detected');
    }
    const exhibits = parseCaliforniaScienceExhibitions(html);
    if (exhibits.length > 0) {
      return { museumId: 'california-science', exhibits, errors };
    }
    throw new Error('No exhibits found in HTML response');
  } catch {
    // Fallback: try Playwright if available
    try {
      const exhibits = await scrapeWithPlaywright();
      return { museumId: 'california-science', exhibits, errors };
    } catch (pwErr) {
      errors.push(`CA Science Center: Cloudflare blocked and Playwright unavailable (${pwErr}). Use existing data.`);
      return { museumId: 'california-science', exhibits: [], errors };
    }
  }
}

async function scrapeWithPlaywright(): Promise<ScrapedExhibit[]> {
  // Dynamic import — only loads if playwright is installed
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(EXHIBITS_URL, { waitUntil: 'networkidle' });
    const html = await page.content();
    return parseCaliforniaScienceExhibitions(html);
  } finally {
    await browser.close();
  }
}
