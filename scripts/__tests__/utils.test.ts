import { describe, it, expect } from 'vitest';
import { parseDateRange, isTemporaryExhibit, generateExhibitId } from '../scrapers/utils';

describe('parseDateRange', () => {
  it('parses "Month Day, Year – Month Day, Year"', () => {
    const result = parseDateRange('February 24, 2026 – June 14, 2026');
    expect(result).toEqual({ startDate: '2026-02-24', endDate: '2026-06-14' });
  });

  it('parses "Month Day – Month Day, Year" (same year)', () => {
    const result = parseDateRange('November 18, 2025 – April 12, 2026');
    expect(result).toEqual({ startDate: '2025-11-18', endDate: '2026-04-12' });
  });

  it('parses "Mon Day, Year – Mon Day, Year" with abbreviated months', () => {
    const result = parseDateRange('Feb 24, 2026 – Jun 14, 2026');
    expect(result).toEqual({ startDate: '2026-02-24', endDate: '2026-06-14' });
  });

  it('parses date with em-dash', () => {
    const result = parseDateRange('January 27, 2026\u2014April 19, 2026');
    expect(result).toEqual({ startDate: '2026-01-27', endDate: '2026-04-19' });
  });

  it('parses "Through Month Day, Year" (no start date)', () => {
    const result = parseDateRange('Through June 14, 2026');
    expect(result).toEqual({ startDate: null, endDate: '2026-06-14' });
  });

  it('parses "Now through Month Day, Year"', () => {
    const result = parseDateRange('Now through December 31, 2026');
    expect(result).toEqual({ startDate: null, endDate: '2026-12-31' });
  });

  it('parses "Ongoing" as no dates', () => {
    const result = parseDateRange('Ongoing');
    expect(result).toEqual({ startDate: null, endDate: null });
  });

  it('returns nulls for empty string', () => {
    const result = parseDateRange('');
    expect(result).toEqual({ startDate: null, endDate: null });
  });

  it('handles "Month Day–Month Day, Year" without spaces around dash', () => {
    const result = parseDateRange('October 23, 2025–May 3, 2026');
    expect(result).toEqual({ startDate: '2025-10-23', endDate: '2026-05-03' });
  });
});

describe('isTemporaryExhibit', () => {
  it('returns true for exhibit with start and end date within 3 years', () => {
    expect(isTemporaryExhibit({
      startDate: '2026-01-01',
      endDate: '2026-06-01',
      title: 'Some Art Show',
    })).toBe(true);
  });

  it('returns false when no end date', () => {
    expect(isTemporaryExhibit({
      startDate: '2026-01-01',
      endDate: null,
      title: 'Some Art Show',
    })).toBe(false);
  });

  it('returns false for exhibits longer than 3 years', () => {
    expect(isTemporaryExhibit({
      startDate: '2020-01-01',
      endDate: '2027-12-31',
      title: 'Some Art Show',
    })).toBe(false);
  });

  it('returns false for titles containing "permanent"', () => {
    expect(isTemporaryExhibit({
      startDate: '2026-01-01',
      endDate: '2026-06-01',
      title: 'Permanent Collection Highlights',
    })).toBe(false);
  });

  it('returns false for titles containing "ongoing"', () => {
    expect(isTemporaryExhibit({
      startDate: '2026-01-01',
      endDate: '2026-06-01',
      title: 'Ongoing Exhibition',
    })).toBe(false);
  });

  it('returns true for a normal temporary exhibit', () => {
    expect(isTemporaryExhibit({
      startDate: '2025-11-22',
      endDate: '2026-04-05',
      title: 'Robert Therrien: This is a Story',
    })).toBe(true);
  });
});

describe('generateExhibitId', () => {
  it('generates id from museum id and title', () => {
    const id = generateExhibitId('getty', 'Photography and the Black Arts Movement');
    expect(id).toBe('getty-photography-and-the-black-arts-movement');
  });

  it('strips special characters', () => {
    const id = generateExhibitId('lacma', 'Arp-Klee: With Selections');
    expect(id).toBe('lacma-arp-klee-with-selections');
  });

  it('collapses multiple dashes', () => {
    const id = generateExhibitId('moca', 'MONUMENTS!!!  Big Show');
    expect(id).toBe('moca-monuments-big-show');
  });

  it('trims trailing dashes', () => {
    const id = generateExhibitId('broad', 'Test Title ---');
    expect(id).toBe('broad-test-title');
  });
});
