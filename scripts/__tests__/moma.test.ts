import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseMomaListings, parseMomaDetailPage, parseMomaDateRange } from '../scrapers/moma';

const listingFixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/moma.html'),
  'utf-8'
);

const detailFixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/moma-detail.html'),
  'utf-8'
);

describe('parseMomaDateRange', () => {
  it('parses "Through Month Day" format', () => {
    expect(parseMomaDateRange('Through Mar\u00a03')).toEqual({
      startDate: null,
      endDate: `${new Date().getFullYear()}-03-03`,
    });
  });

  it('parses "Through Month Day, Year" format', () => {
    expect(parseMomaDateRange('Through Apr 11, 2026')).toEqual({
      startDate: null,
      endDate: '2026-04-11',
    });
  });

  it('parses "Month Day–Month Day, Year" range', () => {
    expect(parseMomaDateRange('Mar 4\u2013May 25, 2026')).toEqual({
      startDate: '2026-03-04',
      endDate: '2026-05-25',
    });
  });

  it('parses cross-year range', () => {
    expect(parseMomaDateRange('Nov 14, 2026\u2013Feb 15, 2027')).toEqual({
      startDate: '2026-11-14',
      endDate: '2027-02-15',
    });
  });

  it('parses same-month range like "Aug 8–30, 2026"', () => {
    expect(parseMomaDateRange('Aug 8\u201330, 2026')).toEqual({
      startDate: '2026-08-08',
      endDate: '2026-08-30',
    });
  });

  it('parses "Through Spring 2027" with season approximation', () => {
    expect(parseMomaDateRange('Through Spring 2027')).toEqual({
      startDate: null,
      endDate: '2027-06-01',
    });
  });

  it('parses "Month Day, Year–Season Year" range', () => {
    expect(parseMomaDateRange('Sep 20, 2026\u2013Spring 2027')).toEqual({
      startDate: '2026-09-20',
      endDate: '2027-06-01',
    });
  });

  it('returns nulls for "Ongoing"', () => {
    expect(parseMomaDateRange('Ongoing')).toEqual({
      startDate: null,
      endDate: null,
    });
  });

  it('returns nulls for empty string', () => {
    expect(parseMomaDateRange('')).toEqual({
      startDate: null,
      endDate: null,
    });
  });

  it('infers start year from end year when start has no year', () => {
    expect(parseMomaDateRange('Mar 21\u2013Sep 12, 2026')).toEqual({
      startDate: '2026-03-21',
      endDate: '2026-09-12',
    });
  });
});

describe('parseMomaListings', () => {
  const listings = parseMomaListings(listingFixture);

  it('parses multiple exhibitions', () => {
    expect(listings.length).toBeGreaterThanOrEqual(15);
  });

  it('includes current exhibitions like Wifredo Lam', () => {
    const titles = listings.map(e => e.title);
    const lam = titles.find(t => t.includes('Wifredo Lam') && !t.includes('espa'));
    expect(lam).toBeTruthy();
  });

  it('includes current exhibitions like Odili Donald Odita', () => {
    const titles = listings.map(e => e.title);
    expect(titles).toContain('Odili Donald Odita: Songs from Life');
  });

  it('includes upcoming exhibitions like Peggy Weil', () => {
    const titles = listings.map(e => e.title);
    expect(titles).toContain('Peggy Weil: Core Memory');
  });

  it('includes upcoming exhibitions like Frida and Diego', () => {
    const titles = listings.map(e => e.title);
    expect(titles).toContain('Frida and Diego: The Last Dream');
  });

  it('includes upcoming exhibitions like Na Mira', () => {
    const titles = listings.map(e => e.title);
    expect(titles).toContain('Na Mira: NO SMOKING');
  });

  it('excludes ongoing Collection exhibits', () => {
    const titles = listings.map(e => e.title);
    const collectionExhibits = titles.filter(t => /^collection\s/i.test(t));
    expect(collectionExhibits).toHaveLength(0);
  });

  it('excludes Art Lab: Sound', () => {
    const titles = listings.map(e => e.title);
    expect(titles).not.toContain('Art Lab: Sound');
  });

  it('excludes Modern Mural', () => {
    const titles = listings.map(e => e.title);
    const murals = titles.filter(t => /^modern mural/i.test(t));
    expect(murals).toHaveLength(0);
  });

  it('excludes exhibits with "Ongoing" dates', () => {
    const titles = listings.map(e => e.title);
    expect(titles).not.toContain("The Sumptuous Discovery of Gotham a Go-Go");
  });

  it('extracts exhibition URLs with numeric IDs', () => {
    const lam = listings.find(e => e.title.includes('Wifredo Lam'));
    expect(lam?.url).toBe('https://www.moma.org/calendar/exhibitions/5788');
  });

  it('extracts date text', () => {
    const murray = listings.find(e => e.title.includes('Elizabeth Murray'));
    expect(murray?.dateText).toMatch(/Mar.*May.*2026/);
  });

  it('extracts image URLs', () => {
    const lam = listings.find(e => e.title.includes('Wifredo Lam'));
    expect(lam?.imageUrl).toContain('moma.org/d/assets/');
  });

  it('strips Wayback Machine prefix from image URLs', () => {
    const exhibit = listings.find(e => e.imageUrl);
    expect(exhibit?.imageUrl).not.toContain('web.archive.org');
  });

  it('deduplicates exhibits by ID', () => {
    const ids = listings.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('parseMomaDetailPage', () => {
  it('extracts description from JSON-LD', () => {
    const description = parseMomaDetailPage(detailFixture);
    expect(description).toContain('Wifredo Lam');
    expect(description.length).toBeGreaterThan(100);
  });

  it('strips "Exhibition. Date." prefix from description', () => {
    const description = parseMomaDetailPage(detailFixture);
    expect(description).not.toMatch(/^Exhibition\./);
  });

  it('returns empty string for page with no data', () => {
    const description = parseMomaDetailPage('<html><head></head><body></body></html>');
    expect(description).toBe('');
  });

  it('falls back to meta description when no JSON-LD', () => {
    const html = `<html><head>
      <meta name="description" content="Exhibition. Through Apr 11, 2026. A great exhibit about art." />
    </head><body></body></html>`;
    const description = parseMomaDetailPage(html);
    expect(description).toBe('A great exhibit about art.');
  });
});
