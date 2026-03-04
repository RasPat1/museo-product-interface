import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseCaliforniaScienceExhibitions } from '../scrapers/california-science';

const fixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/california-science.html'),
  'utf-8'
);

describe('parseCaliforniaScienceExhibitions', () => {
  it('returns empty array for Cloudflare challenge page', () => {
    const exhibits = parseCaliforniaScienceExhibitions(fixture);
    expect(exhibits).toEqual([]);
  });

  it('parses valid HTML when available', () => {
    const mockHtml = `
      <html><body>
        <a href="/exhibits/mummies">
          <h3>Mummies of the World</h3>
          <img src="/img/mummies.jpg" />
        </a>
        <a href="/exhibits/game-on">
          <h3>GAME ON! Science, Sports & Play</h3>
          <img src="/img/gameon.jpg" />
        </a>
      </body></html>
    `;
    const exhibits = parseCaliforniaScienceExhibitions(mockHtml);
    expect(exhibits.length).toBe(2);
    expect(exhibits[0].title).toBe('Mummies of the World');
    expect(exhibits[0].url).toBe('https://californiasciencecenter.org/exhibits/mummies');
    expect(exhibits[1].title).toBe('GAME ON! Science, Sports & Play');
  });
});
