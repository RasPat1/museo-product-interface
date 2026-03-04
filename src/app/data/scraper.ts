/**
 * Museum Data Scraper - Placeholder
 *
 * This module will eventually scrape real exhibit data from museum websites.
 * For now, it loads data from local JSON files that were manually curated.
 *
 * Data sources (last scraped: 2026-03-03):
 *   - LACMA:              https://www.lacma.org/art/exhibitions/current
 *                         NOTE: Page has "Load More" button — paginated via ?page=0, ?page=1, ?page=2
 *   - The Broad:          https://www.thebroad.org/art
 *   - NHM LA:             https://nhm.org/experience-nhm/exhibitions-natural-history-museum
 *   - CA Science Center:  https://californiasciencecenter.org/exhibits
 *   - MOCA:               https://www.moca.org/exhibitions
 *   - Getty Center:       https://www.getty.edu/exhibitions/
 *
 * TODO: Implement automated scrapers for each museum website.
 * Suggested approach:
 *   1. Use a server-side script (Node.js) with cheerio or puppeteer
 *   2. Run on a schedule (e.g. weekly cron) to refresh the JSON files
 *   3. Output to src/app/data/museums.json and src/app/data/exhibits.json
 *   4. For LACMA, iterate pages until no more results (Load More pattern)
 */

import type { Museum, Exhibit } from '../types';
import museumsJson from './museums.json';
import exhibitsJson from './exhibits.json';

/** Load museums from the local JSON data. */
export function getMuseums(): Museum[] {
  return museumsJson as Museum[];
}

/** Load exhibits from the local JSON data. */
export function getExhibits(): Exhibit[] {
  return exhibitsJson as Exhibit[];
}

/**
 * Placeholder: fetch fresh data from museum websites.
 * Currently just returns local JSON data.
 *
 * When implemented, this would:
 *   1. Scrape each museum's exhibitions page
 *   2. Parse exhibit titles, dates, descriptions, images
 *   3. Normalize into Museum[] and Exhibit[] shapes
 *   4. Optionally write updated JSON files to disk
 */
export async function scrapeMuseumData(): Promise<{
  museums: Museum[];
  exhibits: Exhibit[];
}> {
  // TODO: Replace with actual scraping logic
  console.warn('[scraper] Using local JSON data. Implement scraping to fetch live data.');
  return {
    museums: getMuseums(),
    exhibits: getExhibits(),
  };
}
