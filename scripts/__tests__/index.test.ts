import { describe, it, expect } from 'vitest';
import { mergeResults, scrapedToExhibit } from '../scrapers/index';
import type { ScraperResult } from '../scrapers/types';
import type { Exhibit } from '../../src/app/types/index';

describe('scrapedToExhibit', () => {
  it('converts a ScrapedExhibit to an Exhibit', () => {
    const result = scrapedToExhibit('getty', {
      title: 'Test Exhibition',
      description: 'A test',
      startDate: '2026-01-01',
      endDate: '2026-06-01',
      imageUrl: 'https://example.com/img.jpg',
      category: 'Art',
      url: 'https://getty.edu/exhibitions/test',
    });

    expect(result.id).toBe('getty-test-exhibition');
    expect(result.museumId).toBe('getty');
    expect(result.title).toBe('Test Exhibition');
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2026-06-01');
    expect(result.imageUrl).toBe('https://example.com/img.jpg');
    expect(result.category).toBe('Art');
    expect(result.url).toBe('https://getty.edu/exhibitions/test');
  });

  it('handles null fields gracefully', () => {
    const result = scrapedToExhibit('moca', {
      title: 'Minimal',
      description: '',
      startDate: null,
      endDate: null,
      imageUrl: null,
      category: null,
      url: null,
    });

    expect(result.startDate).toBe('');
    expect(result.endDate).toBe('');
    expect(result.imageUrl).toBe('');
    expect(result.category).toBe('');
    expect(result.url).toBe('');
  });
});

describe('mergeResults', () => {
  const existingExhibits: Exhibit[] = [
    {
      id: 'getty-1',
      museumId: 'getty',
      title: 'Old Getty Exhibit',
      description: 'Old',
      startDate: '2025-01-01',
      endDate: '2025-06-01',
      imageUrl: '',
      category: 'Art',
      url: 'https://getty.edu/exhibitions/old',
    },
    {
      id: 'cs-1',
      museumId: 'california-science',
      title: 'Existing CS Exhibit',
      description: 'Fallback',
      startDate: '2026-01-01',
      endDate: '2026-06-01',
      imageUrl: '',
      category: 'Science',
      url: 'https://californiasciencecenter.org/exhibits/existing',
    },
  ];

  it('replaces exhibits for successful museums', () => {
    const results: ScraperResult[] = [
      {
        museumId: 'getty',
        exhibits: [
          {
            title: 'New Getty Show',
            description: 'Fresh',
            startDate: '2026-03-01',
            endDate: '2026-09-01',
            imageUrl: null,
            category: null,
            url: null,
          },
        ],
        errors: [],
      },
    ];

    const merged = mergeResults(results, existingExhibits);
    const gettyExhibits = merged.filter(e => e.museumId === 'getty');
    expect(gettyExhibits.length).toBe(1);
    expect(gettyExhibits[0].title).toBe('New Getty Show');
  });

  it('preserves existing data for failed museums', () => {
    const results: ScraperResult[] = [
      {
        museumId: 'california-science',
        exhibits: [], // failed - no results
        errors: ['Cloudflare blocked'],
      },
    ];

    const merged = mergeResults(results, existingExhibits);
    const csExhibits = merged.filter(e => e.museumId === 'california-science');
    expect(csExhibits.length).toBe(1);
    expect(csExhibits[0].title).toBe('Existing CS Exhibit');
  });

  it('filters out permanent exhibits based on duration', () => {
    const results: ScraperResult[] = [
      {
        museumId: 'lacma',
        exhibits: [
          {
            title: 'Temporary Show',
            description: '',
            startDate: '2026-01-01',
            endDate: '2026-06-01',
            imageUrl: null,
            category: null,
            url: null,
          },
          {
            title: 'Very Long Show',
            description: '',
            startDate: '2020-01-01',
            endDate: '2027-12-31',
            imageUrl: null,
            category: null,
            url: null,
          },
        ],
        errors: [],
      },
    ];

    const merged = mergeResults(results, []);
    expect(merged.length).toBe(1);
    expect(merged[0].title).toBe('Temporary Show');
  });

  it('preserves URLs through the merge pipeline', () => {
    const results: ScraperResult[] = [
      {
        museumId: 'getty',
        exhibits: [
          {
            title: 'New Getty Show',
            description: 'Fresh',
            startDate: '2026-03-01',
            endDate: '2026-09-01',
            imageUrl: null,
            category: null,
            url: 'https://getty.edu/exhibitions/new-show',
          },
        ],
        errors: [],
      },
      {
        museumId: 'california-science',
        exhibits: [], // failed
        errors: ['Cloudflare blocked'],
      },
    ];

    const merged = mergeResults(results, existingExhibits);

    // Scraped exhibit should have its URL
    const gettyExhibit = merged.find(e => e.museumId === 'getty');
    expect(gettyExhibit?.url).toBe('https://getty.edu/exhibitions/new-show');

    // Preserved exhibit should keep its existing URL
    const csExhibit = merged.find(e => e.museumId === 'california-science');
    expect(csExhibit?.url).toBe('https://californiasciencecenter.org/exhibits/existing');
  });

  it('includes exhibits without date info (cannot filter)', () => {
    const results: ScraperResult[] = [
      {
        museumId: 'broad',
        exhibits: [
          {
            title: 'No Dates Show',
            description: '',
            startDate: null,
            endDate: null,
            imageUrl: null,
            category: null,
            url: null,
          },
        ],
        errors: [],
      },
    ];

    const merged = mergeResults(results, []);
    expect(merged.length).toBe(1);
  });
});
