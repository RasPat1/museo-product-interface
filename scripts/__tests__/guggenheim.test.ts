import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseGuggenheimExhibitions } from '../scrapers/guggenheim';

const fixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/guggenheim.html'),
  'utf-8'
);

describe('parseGuggenheimExhibitions', () => {
  const exhibits = parseGuggenheimExhibitions(fixture);

  it('parses both current and upcoming exhibitions', () => {
    // 4 on_view (minus 1 Ongoing) + 5 upcoming = 8
    expect(exhibits.length).toBeGreaterThanOrEqual(8);
  });

  it('includes current exhibition Gabriele Münter', () => {
    const munter = exhibits.find(e => e.title.includes('Gabriele Münter'));
    expect(munter).toBeTruthy();
  });

  it('includes current exhibition Rauschenberg', () => {
    const raush = exhibits.find(e => e.title.includes('Rauschenberg'));
    expect(raush).toBeTruthy();
  });

  it('includes current exhibition Modern European Currents', () => {
    const exhibit = exhibits.find(e => e.title.includes('Modern European Currents'));
    expect(exhibit).toBeTruthy();
  });

  it('includes upcoming exhibition Carol Bove', () => {
    const bove = exhibits.find(e => e.title === 'Carol Bove');
    expect(bove).toBeTruthy();
  });

  it('includes upcoming exhibition Guggenheim Pop', () => {
    const pop = exhibits.find(e => e.title === 'Guggenheim Pop');
    expect(pop).toBeTruthy();
  });

  it('includes upcoming exhibition Taryn Simon', () => {
    const simon = exhibits.find(e => e.title === 'Taryn Simon');
    expect(simon).toBeTruthy();
  });

  it('includes upcoming exhibition A Year with Children 2026', () => {
    const exhibit = exhibits.find(e => e.title === 'A Year with Children 2026');
    expect(exhibit).toBeTruthy();
  });

  it('includes upcoming exhibition Zidane', () => {
    const exhibit = exhibits.find(e => e.title.includes('Zidane'));
    expect(exhibit).toBeTruthy();
  });

  it('excludes exhibitions with "Ongoing" label', () => {
    const thannhauser = exhibits.find(e => e.title === 'Thannhauser Collection');
    expect(thannhauser).toBeUndefined();
  });

  it('does not include past exhibitions', () => {
    // The fixture has on_view and upcoming sections; past should be excluded.
    // Verify total count matches on_view (non-ongoing) + upcoming only.
    expect(exhibits.length).toBeLessThanOrEqual(9);
  });

  // --- Dates ---

  it('extracts start and end dates in ISO format', () => {
    const munter = exhibits.find(e => e.title.includes('Gabriele Münter'));
    expect(munter?.startDate).toBe('2025-11-07');
    expect(munter?.endDate).toBe('2026-04-26');
  });

  it('parses dates for upcoming exhibitions', () => {
    const bove = exhibits.find(e => e.title === 'Carol Bove');
    expect(bove?.startDate).toBe('2026-03-05');
    expect(bove?.endDate).toBe('2026-08-02');
  });

  it('parses dates with single-digit days correctly', () => {
    const munter = exhibits.find(e => e.title.includes('Gabriele Münter'));
    // Day "7" should become "07"
    expect(munter?.startDate).toBe('2025-11-07');
  });

  // --- Descriptions ---

  it('extracts descriptions from excerpt field', () => {
    const munter = exhibits.find(e => e.title.includes('Gabriele Münter'));
    expect(munter?.description).toContain('seventy paintings');
    expect(munter?.description.length).toBeGreaterThan(20);
  });

  it('strips HTML tags from descriptions', () => {
    const zidane = exhibits.find(e => e.title.includes('Zidane'));
    expect(zidane?.description).not.toContain('<em>');
    expect(zidane?.description).not.toContain('</em>');
  });

  it('trims whitespace from descriptions', () => {
    for (const exhibit of exhibits) {
      expect(exhibit.description).toBe(exhibit.description.trim());
    }
  });

  // --- URLs ---

  it('builds exhibition URLs from slug', () => {
    const munter = exhibits.find(e => e.title.includes('Gabriele Münter'));
    expect(munter?.url).toBe('https://www.guggenheim.org/exhibition/gabriele-munter');
  });

  it('builds correct URLs for all exhibitions', () => {
    for (const exhibit of exhibits) {
      expect(exhibit.url).toMatch(/^https:\/\/www\.guggenheim\.org\/exhibition\/.+/);
    }
  });

  it('builds URL for Carol Bove', () => {
    const bove = exhibits.find(e => e.title === 'Carol Bove');
    expect(bove?.url).toBe('https://www.guggenheim.org/exhibition/carol-bove');
  });

  // --- Images ---

  it('extracts image URLs', () => {
    const munter = exhibits.find(e => e.title.includes('Gabriele Münter'));
    expect(munter?.imageUrl).toContain('Munter');
    expect(munter?.imageUrl).toContain('.jpg');
  });

  it('resolves relative image URLs to absolute', () => {
    for (const exhibit of exhibits) {
      expect(exhibit.imageUrl).toMatch(/^https:\/\/www\.guggenheim\.org\//);
    }
  });

  it('every exhibition has an image URL', () => {
    for (const exhibit of exhibits) {
      expect(exhibit.imageUrl).toBeTruthy();
    }
  });

  // --- Every exhibit has required fields ---

  it('every exhibition has a title', () => {
    for (const exhibit of exhibits) {
      expect(exhibit.title).toBeTruthy();
      expect(exhibit.title.length).toBeGreaterThan(0);
    }
  });

  it('every exhibition has a description', () => {
    for (const exhibit of exhibits) {
      expect(exhibit.description).toBeTruthy();
      expect(exhibit.description.length).toBeGreaterThan(0);
    }
  });

  it('every exhibition has a start date', () => {
    for (const exhibit of exhibits) {
      expect(exhibit.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('every exhibition has an end date', () => {
    for (const exhibit of exhibits) {
      expect(exhibit.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('every exhibition has a URL', () => {
    for (const exhibit of exhibits) {
      expect(exhibit.url).toBeTruthy();
    }
  });

  // --- Edge cases ---

  it('returns empty array for HTML with no bootstrap data', () => {
    const result = parseGuggenheimExhibitions('<html><body></body></html>');
    expect(result).toEqual([]);
  });

  it('returns empty array for malformed bootstrap JSON', () => {
    const html = '<script>bootstrap = {invalid json};</script>';
    const result = parseGuggenheimExhibitions(html);
    expect(result).toEqual([]);
  });
});
