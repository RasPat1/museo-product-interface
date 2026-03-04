import { describe, it, expect } from 'vitest';
import { isLeavingSoon, sortByClosingSoonest } from './exhibitHelpers';
import type { Exhibit } from '../types';

function makeExhibit(overrides: Partial<Exhibit> = {}): Exhibit {
  return {
    id: 'test-1',
    museumId: 'museum-1',
    title: 'Test Exhibit',
    description: 'A test exhibit',
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    imageUrl: 'https://example.com/img.jpg',
    category: 'Art',
    url: 'https://example.com',
    ...overrides,
  };
}

describe('isLeavingSoon', () => {
  it('returns true when exhibit ends within 45 days', () => {
    const today = new Date('2026-03-01');
    expect(isLeavingSoon('2026-04-01', today)).toBe(true); // 31 days
  });

  it('returns true when exhibit ends exactly on day 45', () => {
    const today = new Date('2026-03-01');
    expect(isLeavingSoon('2026-04-15', today)).toBe(true); // 45 days
  });

  it('returns false when exhibit ends in more than 45 days', () => {
    const today = new Date('2026-03-01');
    expect(isLeavingSoon('2026-04-16', today)).toBe(false); // 46 days
  });

  it('returns true when exhibit ends today', () => {
    const today = new Date('2026-03-01');
    expect(isLeavingSoon('2026-03-01', today)).toBe(true); // 0 days
  });

  it('returns false when exhibit has already ended', () => {
    const today = new Date('2026-03-01');
    expect(isLeavingSoon('2026-02-28', today)).toBe(false); // -1 day
  });

  it('returns true when exhibit ends tomorrow', () => {
    const today = new Date('2026-03-01');
    expect(isLeavingSoon('2026-03-02', today)).toBe(true); // 1 day
  });
});

describe('sortByClosingSoonest', () => {
  it('sorts exhibits by endDate ascending', () => {
    const exhibits = [
      makeExhibit({ id: 'far', endDate: '2026-12-01' }),
      makeExhibit({ id: 'soon', endDate: '2026-03-15' }),
      makeExhibit({ id: 'mid', endDate: '2026-06-01' }),
    ];

    const sorted = sortByClosingSoonest(exhibits);

    expect(sorted.map(e => e.id)).toEqual(['soon', 'mid', 'far']);
  });

  it('does not mutate the original array', () => {
    const exhibits = [
      makeExhibit({ id: 'b', endDate: '2026-12-01' }),
      makeExhibit({ id: 'a', endDate: '2026-03-01' }),
    ];

    const original = [...exhibits];
    sortByClosingSoonest(exhibits);

    expect(exhibits.map(e => e.id)).toEqual(original.map(e => e.id));
  });

  it('handles exhibits with the same endDate', () => {
    const exhibits = [
      makeExhibit({ id: 'a', endDate: '2026-06-01' }),
      makeExhibit({ id: 'b', endDate: '2026-06-01' }),
    ];

    const sorted = sortByClosingSoonest(exhibits);

    expect(sorted).toHaveLength(2);
    expect(sorted[0].endDate).toBe('2026-06-01');
    expect(sorted[1].endDate).toBe('2026-06-01');
  });

  it('returns empty array for empty input', () => {
    expect(sortByClosingSoonest([])).toEqual([]);
  });
});
