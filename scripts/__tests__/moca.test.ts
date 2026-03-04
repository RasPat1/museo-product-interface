import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseMocaExhibitions } from '../scrapers/moca';

const fixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/moca.html'),
  'utf-8'
);

describe('parseMocaExhibitions', () => {
  const exhibits = parseMocaExhibitions(fixture);

  it('parses multiple exhibitions', () => {
    expect(exhibits.length).toBeGreaterThanOrEqual(5);
  });

  it('extracts grid-based exhibition titles', () => {
    const titles = exhibits.map(e => e.title);
    expect(titles).toContain('MONUMENTS');
    expect(titles).toContain('Haegue Yang: Star-Crossed Rendezvous');
  });

  it('extracts article-based exhibitions with dates', () => {
    const dianeFocus = exhibits.find(e => e.title.includes('Diane Severin'));
    expect(dianeFocus).toBeDefined();
    expect(dianeFocus?.startDate).toBe('2026-02-01');
    expect(dianeFocus?.endDate).toBe('2026-03-01');
  });

  it('extracts URLs', () => {
    const monuments = exhibits.find(e => e.title === 'MONUMENTS');
    expect(monuments?.url).toBe('https://www.moca.org/exhibition/monuments');
  });

  it('deduplicates exhibitions that appear in both grid and article', () => {
    const titleCounts = new Map<string, number>();
    for (const e of exhibits) {
      titleCounts.set(e.title, (titleCounts.get(e.title) || 0) + 1);
    }
    for (const [title, count] of titleCounts) {
      expect(count, `"${title}" appeared ${count} times`).toBe(1);
    }
  });
});
