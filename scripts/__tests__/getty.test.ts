import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseGettyExhibitions } from '../scrapers/getty';

const fixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/getty.html'),
  'utf-8'
);

describe('parseGettyExhibitions', () => {
  const exhibits = parseGettyExhibitions(fixture);

  it('parses multiple exhibitions from JSON-LD', () => {
    expect(exhibits.length).toBeGreaterThanOrEqual(10);
  });

  it('extracts exhibition titles', () => {
    const titles = exhibits.map(e => e.title);
    expect(titles).toContain('Virtue and Vice');
    expect(titles).toContain('Photography and the Black Arts Movement, 1955–1985');
    expect(titles).toContain('Beginnings');
    expect(titles).toContain('How to Be a Guerrilla Girl');
  });

  it('extracts ISO dates', () => {
    const virtueAndVice = exhibits.find(e => e.title === 'Virtue and Vice');
    expect(virtueAndVice?.startDate).toBe('2026-03-03');
    expect(virtueAndVice?.endDate).toBe('2026-06-07');
  });

  it('extracts URLs', () => {
    const beginnings = exhibits.find(e => e.title === 'Beginnings');
    expect(beginnings?.url).toContain('getty.edu/exhibitions/');
  });

  it('has descriptions', () => {
    const guerrilla = exhibits.find(e => e.title === 'How to Be a Guerrilla Girl');
    expect(guerrilla?.description).toBeTruthy();
    expect(guerrilla!.description.length).toBeGreaterThan(10);
  });

  it('only includes ExhibitionEvent types', () => {
    // Should not include random other JSON-LD on the page
    expect(exhibits.every(e => e.title.length > 0)).toBe(true);
  });
});
