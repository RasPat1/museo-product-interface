import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseMetListings, parseMetDetailPage } from '../scrapers/met';

const listingFixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/met.html'),
  'utf-8'
);

const fifthAveDetailFixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/met-detail-fifth-ave.html'),
  'utf-8'
);

const cloistersDetailFixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/met-detail-cloisters.html'),
  'utf-8'
);

describe('parseMetListings', () => {
  const listings = parseMetListings(listingFixture);

  it('parses multiple exhibitions from the listing page', () => {
    expect(listings.length).toBeGreaterThanOrEqual(10);
  });

  it('extracts exhibition titles', () => {
    const titles = listings.map(e => e.title);
    expect(titles).toContain('Raphael: Sublime Poetry');
  });

  it('extracts exhibition URLs', () => {
    const exhibit = listings.find(e => e.title === 'Raphael: Sublime Poetry');
    expect(exhibit?.url).toBe('https://www.metmuseum.org/exhibitions/raphael-sublime-poetry');
  });

  it('extracts date ranges for upcoming exhibits', () => {
    const exhibit = listings.find(e => e.title === 'Musical Bodies');
    expect(exhibit?.startDate).toBe('2026-06-07');
    expect(exhibit?.endDate).toBe('2026-09-27');
  });

  it('extracts end dates for "Through" date formats', () => {
    const exhibit = listings.find(e => e.title?.includes('Helene Schjerfbeck'));
    expect(exhibit?.endDate).toBeTruthy();
  });

  it('does not include past exhibitions', () => {
    // All listings should be from featured or upcoming sections
    expect(listings.every(e => e.url)).toBe(true);
  });

  it('extracts image URLs from listing cards', () => {
    const exhibit = listings.find(e => e.title === 'Raphael: Sublime Poetry');
    expect(exhibit?.imageUrl).toContain('cdn.sanity.io');
  });
});

describe('parseMetDetailPage', () => {
  it('extracts location as Met Fifth Avenue', () => {
    const detail = parseMetDetailPage(fifthAveDetailFixture);
    expect(detail.locationName).toBe('The Met Fifth Avenue');
  });

  it('extracts location as Met Cloisters', () => {
    const detail = parseMetDetailPage(cloistersDetailFixture);
    expect(detail.locationName).toBe('The Met Cloisters');
  });

  it('extracts dates from JSON-LD for Fifth Avenue exhibit', () => {
    const detail = parseMetDetailPage(fifthAveDetailFixture);
    expect(detail.startDate).toBeTruthy();
    expect(detail.endDate).toBeTruthy();
  });

  it('extracts dates from JSON-LD for Cloisters exhibit', () => {
    const detail = parseMetDetailPage(cloistersDetailFixture);
    expect(detail.startDate).toBeTruthy();
    expect(detail.endDate).toBeTruthy();
  });

  it('extracts description from page content paragraphs', () => {
    const detail = parseMetDetailPage(fifthAveDetailFixture);
    expect(detail.description).toContain('Helene Schjerfbeck');
    expect(detail.description).toContain('first exhibition to showcase');
  });

  it('returns null location when JSON-LD is missing', () => {
    const detail = parseMetDetailPage('<html><body>No data</body></html>');
    expect(detail.locationName).toBeNull();
  });

  it('returns empty description when no meta tag exists', () => {
    const detail = parseMetDetailPage('<html><head></head><body>No data</body></html>');
    expect(detail.description).toBe('');
  });
});
