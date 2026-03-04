import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseNhmExhibitions } from '../scrapers/nhm';

const fixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/nhm.html'),
  'utf-8'
);

describe('parseNhmExhibitions', () => {
  const exhibits = parseNhmExhibitions(fixture);

  it('only includes Special Exhibition items', () => {
    // Should have 5 special exhibitions (excludes SEM Lab if minor)
    expect(exhibits.length).toBeGreaterThanOrEqual(3);
    expect(exhibits.length).toBeLessThanOrEqual(6);
  });

  it('includes known special exhibitions', () => {
    const titles = exhibits.map(e => e.title);
    expect(titles).toContain('Unearthed: Raw Beauty');
    expect(titles).toContain('Collective Knowledge from Our Changing World');
  });

  it('excludes ongoing exhibitions', () => {
    const titles = exhibits.map(e => e.title);
    expect(titles).not.toContain('Dinosaur Hall');
    expect(titles).not.toContain('Nature Gardens');
    expect(titles).not.toContain('Gem and Mineral Hall');
  });

  it('excludes online exhibitions', () => {
    const titles = exhibits.map(e => e.title);
    expect(titles).not.toContain('Sin Censura: A Mural Remembers Los Angeles');
  });

  it('extracts URLs', () => {
    expect(exhibits[0].url).toContain('nhm.org');
  });

  it('sets category to Natural History', () => {
    expect(exhibits.every(e => e.category === 'Natural History')).toBe(true);
  });
});
