import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseBroadExhibitions } from '../scrapers/broad';

const fixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/broad.html'),
  'utf-8'
);

describe('parseBroadExhibitions', () => {
  const exhibits = parseBroadExhibitions(fixture);

  it('only includes Special Exhibition items', () => {
    expect(exhibits.length).toBe(2);
  });

  it('includes Robert Therrien show', () => {
    const titles = exhibits.map(e => e.title);
    expect(titles).toContain('Robert Therrien: This is a Story');
  });

  it('includes Yoko Ono show', () => {
    const titles = exhibits.map(e => e.title);
    expect(titles).toContain('Yoko Ono: Music of the Mind');
  });

  it('filters out Featured Installation and Featured Artwork', () => {
    const titles = exhibits.map(e => e.title);
    expect(titles).not.toContain('Yayoi Kusama\'s Infinity Mirror Rooms');
    expect(titles).not.toContain('Featured Installation of Takashi Murakami');
  });

  it('extracts URLs', () => {
    expect(exhibits[0].url).toContain('thebroad.org');
  });

  it('sets category to Contemporary Art', () => {
    expect(exhibits.every(e => e.category === 'Contemporary Art')).toBe(true);
  });
});
