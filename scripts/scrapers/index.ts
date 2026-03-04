import fs from 'fs';
import path from 'path';
import type { ScrapedExhibit, ScraperResult, ScraperFn } from './types';
import { generateExhibitId, isTemporaryExhibit } from './utils';
import { scrape as scrapeGetty } from './getty';
import { scrape as scrapeLacma } from './lacma';
import { scrape as scrapeMoca } from './moca';
import { scrape as scrapeBroad } from './broad';
import { scrape as scrapeNhm } from './nhm';
import { scrape as scrapeCaliforniaScience } from './california-science';
import { scrape as scrapeMet } from './met';
import { scrape as scrapeMoma } from './moma';
import { scrape as scrapeGuggenheim } from './guggenheim';

import type { Exhibit, Museum } from '../../src/app/types/index';

const MUSEUMS_JSON_PATH = path.resolve(
  import.meta.dirname,
  '../../src/app/data/museums.json'
);

export function loadMuseumCategories(): Record<string, string> {
  try {
    const raw = fs.readFileSync(MUSEUMS_JSON_PATH, 'utf-8');
    const museums: Museum[] = JSON.parse(raw);
    const map: Record<string, string> = {};
    for (const m of museums) {
      map[m.id] = m.category;
    }
    return map;
  } catch {
    return {};
  }
}

export const SCRAPERS: Record<string, ScraperFn> = {
  getty: scrapeGetty,
  lacma: scrapeLacma,
  moca: scrapeMoca,
  broad: scrapeBroad,
  nhm: scrapeNhm,
  'california-science': scrapeCaliforniaScience,
  moma: scrapeMoma,
  guggenheim: scrapeGuggenheim,
};

// Scrapers that return multiple results (one per venue)
export const MULTI_SCRAPERS: Record<string, () => Promise<ScraperResult[]>> = {
  met: scrapeMet,
};

const EXHIBITS_JSON_PATH = path.resolve(
  import.meta.dirname,
  '../../src/app/data/exhibits.json'
);

export function scrapedToExhibit(
  museumId: string,
  scraped: ScrapedExhibit,
  museumCategory?: string,
): Exhibit {
  return {
    id: generateExhibitId(museumId, scraped.title),
    museumId,
    title: scraped.title,
    description: scraped.description || '',
    startDate: scraped.startDate || '',
    endDate: scraped.endDate || '',
    imageUrl: scraped.imageUrl || '',
    category: scraped.category || museumCategory || '',
    url: scraped.url || '',
  };
}

export function mergeResults(
  results: ScraperResult[],
  existingExhibits: Exhibit[],
  museumCategories?: Record<string, string>,
): Exhibit[] {
  const merged: Exhibit[] = [];
  const succeededMuseums = new Set<string>();
  const categories = museumCategories ?? loadMuseumCategories();

  for (const result of results) {
    if (result.exhibits.length > 0) {
      succeededMuseums.add(result.museumId);

      for (const scraped of result.exhibits) {
        // Filter to temporary exhibits only (when we have date info)
        if (scraped.startDate && scraped.endDate) {
          if (!isTemporaryExhibit({
            startDate: scraped.startDate,
            endDate: scraped.endDate,
            title: scraped.title,
          })) {
            continue;
          }
        }

        merged.push(scrapedToExhibit(result.museumId, scraped, categories[result.museumId]));
      }
    }
  }

  // For museums that failed, preserve their existing data
  for (const exhibit of existingExhibits) {
    if (!succeededMuseums.has(exhibit.museumId)) {
      merged.push(exhibit);
    }
  }

  return merged;
}

export interface RunOptions {
  museums?: string[];
  dryRun?: boolean;
}

export async function runScrapers(options: RunOptions = {}): Promise<{
  exhibits: Exhibit[];
  errors: string[];
}> {
  const allScraperIds = [...Object.keys(SCRAPERS), ...Object.keys(MULTI_SCRAPERS)];
  const museumIds = options.museums || allScraperIds;
  const allErrors: string[] = [];
  const results: ScraperResult[] = [];

  // Load existing exhibits for fallback
  let existingExhibits: Exhibit[] = [];
  try {
    const raw = fs.readFileSync(EXHIBITS_JSON_PATH, 'utf-8');
    existingExhibits = JSON.parse(raw);
  } catch {
    // No existing file, start fresh
  }

  // Run scrapers concurrently
  const promises = museumIds.map(async (id) => {
    // Check multi-scrapers first
    const multiScraper = MULTI_SCRAPERS[id];
    if (multiScraper) {
      console.log(`Scraping ${id} (multi-venue)...`);
      const multiResults = await multiScraper();
      for (const result of multiResults) {
        results.push(result);
        allErrors.push(...result.errors);
        console.log(`  ${result.museumId}: ${result.exhibits.length} exhibits found`);
      }
      return;
    }

    const scraper = SCRAPERS[id];
    if (!scraper) {
      allErrors.push(`Unknown museum: ${id}`);
      return;
    }
    console.log(`Scraping ${id}...`);
    const result = await scraper();
    results.push(result);
    allErrors.push(...result.errors);
    console.log(`  ${id}: ${result.exhibits.length} exhibits found`);
  });

  await Promise.all(promises);

  const exhibits = mergeResults(results, existingExhibits);

  if (!options.dryRun) {
    fs.writeFileSync(EXHIBITS_JSON_PATH, JSON.stringify(exhibits, null, 2) + '\n');
    console.log(`\nWrote ${exhibits.length} exhibits to ${EXHIBITS_JSON_PATH}`);
  } else {
    console.log(`\n[Dry run] Would write ${exhibits.length} exhibits`);
    console.log(JSON.stringify(exhibits, null, 2));
  }

  if (allErrors.length > 0) {
    console.warn('\nErrors:');
    for (const err of allErrors) {
      console.warn(`  - ${err}`);
    }
  }

  return { exhibits, errors: allErrors };
}
