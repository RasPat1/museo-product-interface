import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseLacmaExhibitions, hasMorePages } from '../scrapers/lacma';

const page0 = fs.readFileSync(
  path.join(__dirname, 'fixtures/lacma-page0.html'),
  'utf-8'
);
const page1 = fs.readFileSync(
  path.join(__dirname, 'fixtures/lacma-page1.html'),
  'utf-8'
);

describe('parseLacmaExhibitions', () => {
  it('parses exhibitions from page 0', () => {
    const exhibits = parseLacmaExhibitions(page0);
    expect(exhibits.length).toBe(8);
  });

  it('extracts titles correctly', () => {
    const exhibits = parseLacmaExhibitions(page0);
    const titles = exhibits.map(e => e.title);
    expect(titles).toContain('Deep Cuts: Block Printing Across Cultures');
  });

  it('extracts dates', () => {
    const exhibits = parseLacmaExhibitions(page0);
    const deepCuts = exhibits.find(e => e.title === 'Deep Cuts: Block Printing Across Cultures');
    expect(deepCuts?.startDate).toBe('2025-11-09');
    expect(deepCuts?.endDate).toBe('2026-09-13');
  });

  it('handles start date without year by inferring from end date', () => {
    const exhibits = parseLacmaExhibitions(page0);
    const sueno = exhibits.find(e => e.title.includes('PERRO'));
    // Start: "February 22" + inferred year from end "July 26, 2026"
    expect(sueno?.startDate).toBe('2026-02-22');
    expect(sueno?.endDate).toBe('2026-07-26');
  });

  it('extracts URLs with lacma.org base', () => {
    const exhibits = parseLacmaExhibitions(page0);
    expect(exhibits[0].url).toMatch(/^https:\/\/www\.lacma\.org\//);
  });

  it('parses page 1 correctly', () => {
    const exhibits = parseLacmaExhibitions(page1);
    expect(exhibits.length).toBe(8);
    const titles = exhibits.map(e => e.title);
    expect(titles).toContain('Modern Art');
  });
});

describe('hasMorePages', () => {
  it('returns true when next page link exists', () => {
    expect(hasMorePages(page0)).toBe(true);
  });

  it('returns false for page with no next link', () => {
    // A page with no pager should return false
    expect(hasMorePages('<html><body>No pager</body></html>')).toBe(false);
  });
});
