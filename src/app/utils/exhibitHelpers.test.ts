import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import { parseLocalDate, isLeavingSoon, sortByClosingSoonest, getMuseumIdsFromExhibits, clearInterestedExhibits } from './exhibitHelpers';
import type { Exhibit, CurationState } from '../types';

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

describe('parseLocalDate', () => {
  it('parses a YYYY-MM-DD string to the correct local date', () => {
    const date = parseLocalDate('2026-03-05');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2); // 0-indexed: March = 2
    expect(date.getDate()).toBe(5);
  });

  it('does not shift the date back a day like new Date() would', () => {
    // new Date("2026-03-05") parses as UTC midnight, which in US timezones
    // becomes March 4th. parseLocalDate should always give March 5th.
    const dateStr = '2026-03-05';
    const parsed = parseLocalDate(dateStr);
    const formatted = format(parsed, 'MMM d, yyyy');
    expect(formatted).toBe('Mar 5, 2026');
  });

  it('handles end-of-month dates correctly', () => {
    const date = parseLocalDate('2026-03-31');
    expect(date.getDate()).toBe(31);
    expect(format(date, 'MMM d, yyyy')).toBe('Mar 31, 2026');
  });

  it('handles January 1st (month boundary)', () => {
    const date = parseLocalDate('2026-01-01');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });

  it('handles December 31st (year boundary)', () => {
    const date = parseLocalDate('2025-12-31');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(11);
    expect(date.getDate()).toBe(31);
  });

  it('formats consistently for all months', () => {
    const dates = [
      ['2026-01-15', 'Jan 15, 2026'],
      ['2026-06-01', 'Jun 1, 2026'],
      ['2026-09-30', 'Sep 30, 2026'],
      ['2026-12-25', 'Dec 25, 2026'],
    ];
    for (const [input, expected] of dates) {
      expect(format(parseLocalDate(input), 'MMM d, yyyy')).toBe(expected);
    }
  });
});

describe('isLeavingSoon', () => {
  it('returns true when exhibit ends within 45 days', () => {
    const today = new Date(2026, 2, 1); // March 1 as local date
    expect(isLeavingSoon('2026-04-01', today)).toBe(true); // 31 days
  });

  it('returns true when exhibit ends exactly on day 45', () => {
    const today = new Date(2026, 2, 1); // March 1 as local date
    expect(isLeavingSoon('2026-04-15', today)).toBe(true); // 45 days
  });

  it('returns false when exhibit ends in more than 45 days', () => {
    const today = new Date(2026, 2, 1); // March 1 as local date
    expect(isLeavingSoon('2026-04-16', today)).toBe(false); // 46 days
  });

  it('returns true when exhibit ends today', () => {
    const today = new Date(2026, 2, 1); // March 1 as local date
    expect(isLeavingSoon('2026-03-01', today)).toBe(true); // 0 days
  });

  it('returns false when exhibit has already ended', () => {
    const today = new Date(2026, 2, 1); // March 1 as local date
    expect(isLeavingSoon('2026-02-28', today)).toBe(false); // -1 day
  });

  it('returns true when exhibit ends tomorrow', () => {
    const today = new Date(2026, 2, 1); // March 1 as local date
    expect(isLeavingSoon('2026-03-02', today)).toBe(true); // 1 day
  });
  it('returns false when endDate is empty', () => {
    expect(isLeavingSoon('')).toBe(false);
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

  it('sorts exhibits with empty endDate to the end', () => {
    const exhibits = [
      makeExhibit({ id: 'no-end', endDate: '' }),
      makeExhibit({ id: 'soon', endDate: '2026-03-15' }),
      makeExhibit({ id: 'later', endDate: '2026-12-01' }),
    ];

    const sorted = sortByClosingSoonest(exhibits);
    expect(sorted.map(e => e.id)).toEqual(['soon', 'later', 'no-end']);
  });
});

describe('getMuseumIdsFromExhibits', () => {
  it('returns unique museum IDs from exhibits', () => {
    const exhibits = [
      makeExhibit({ id: 'a', museumId: 'lacma' }),
      makeExhibit({ id: 'b', museumId: 'getty' }),
      makeExhibit({ id: 'c', museumId: 'lacma' }),
    ];

    expect(getMuseumIdsFromExhibits(exhibits)).toEqual(['lacma', 'getty']);
  });

  it('preserves insertion order (first occurrence)', () => {
    const exhibits = [
      makeExhibit({ id: 'a', museumId: 'moca' }),
      makeExhibit({ id: 'b', museumId: 'broad' }),
      makeExhibit({ id: 'c', museumId: 'getty' }),
      makeExhibit({ id: 'd', museumId: 'broad' }),
    ];

    expect(getMuseumIdsFromExhibits(exhibits)).toEqual(['moca', 'broad', 'getty']);
  });

  it('returns empty array for empty input', () => {
    expect(getMuseumIdsFromExhibits([])).toEqual([]);
  });

  it('returns single museum when all exhibits are from same museum', () => {
    const exhibits = [
      makeExhibit({ id: 'a', museumId: 'lacma' }),
      makeExhibit({ id: 'b', museumId: 'lacma' }),
    ];

    expect(getMuseumIdsFromExhibits(exhibits)).toEqual(['lacma']);
  });
});

describe('clearInterestedExhibits', () => {
  it('clears all interested exhibits', () => {
    const state: CurationState = {
      selectedMuseums: ['lacma', 'getty'],
      interestedExhibits: ['exhibit-1', 'exhibit-2', 'exhibit-3'],
    };

    const result = clearInterestedExhibits(state);
    expect(result.interestedExhibits).toEqual([]);
  });

  it('preserves selected museums', () => {
    const state: CurationState = {
      selectedMuseums: ['lacma', 'getty'],
      interestedExhibits: ['exhibit-1'],
    };

    const result = clearInterestedExhibits(state);
    expect(result.selectedMuseums).toEqual(['lacma', 'getty']);
  });

  it('does not mutate the original state', () => {
    const state: CurationState = {
      selectedMuseums: ['lacma'],
      interestedExhibits: ['exhibit-1'],
    };

    const result = clearInterestedExhibits(state);
    expect(state.interestedExhibits).toEqual(['exhibit-1']);
    expect(result).not.toBe(state);
  });

  it('handles already empty interested list', () => {
    const state: CurationState = {
      selectedMuseums: ['moca'],
      interestedExhibits: [],
    };

    const result = clearInterestedExhibits(state);
    expect(result.interestedExhibits).toEqual([]);
  });
});
