import { describe, it, expect } from 'vitest';
import { generateICS } from '../../src/app/utils/icsGenerator';
import { getMuseums } from '../../src/app/data/scraper';
import { getMuseumIdsByCity } from '../../src/app/utils/museumHelpers';
import { getExhibits } from '../../src/app/data/scraper';
import { sortByClosingSoonest } from '../../src/app/utils/exhibitHelpers';
import type { Exhibit } from '../../src/app/types';

/**
 * End-to-end test simulating the LA exhibitions → calendar flow:
 *   1. Select LA as city (get LA museum IDs)
 *   2. Filter exhibits to LA museums
 *   3. Select exhibits (add to interested)
 *   4. Generate ICS calendar file
 *   5. Verify the ICS content is correct
 */

const museums = getMuseums();
const allExhibits = getExhibits();
const laMuseumIds = getMuseumIdsByCity(museums, 'los-angeles');
const laExhibits = allExhibits.filter(e => laMuseumIds.includes(e.museumId));

describe('LA exhibitions → ICS calendar (end-to-end)', () => {
  it('selects the correct LA museums', () => {
    expect(laMuseumIds).toContain('lacma');
    expect(laMuseumIds).toContain('broad');
    expect(laMuseumIds).toContain('getty');
    expect(laMuseumIds).toContain('moca');
    expect(laMuseumIds).toContain('nhm');
    expect(laMuseumIds).toContain('california-science');
    // Should not include NYC museums
    expect(laMuseumIds).not.toContain('met');
    expect(laMuseumIds).not.toContain('moma');
    expect(laMuseumIds).not.toContain('guggenheim');
  });

  it('filters exhibits to only LA museums', () => {
    expect(laExhibits.length).toBeGreaterThan(0);
    for (const exhibit of laExhibits) {
      expect(laMuseumIds).toContain(exhibit.museumId);
    }
  });

  it('sorts LA exhibits by closing soonest', () => {
    const sorted = sortByClosingSoonest(laExhibits);
    const datedExhibits = sorted.filter(e => e.endDate);
    for (let i = 1; i < datedExhibits.length; i++) {
      expect(datedExhibits[i].endDate >= datedExhibits[i - 1].endDate).toBe(true);
    }
  });

  describe('ICS generation with all LA exhibits', () => {
    const ics = generateICS(laExhibits);

    it('produces valid VCALENDAR wrapping', () => {
      expect(ics).toMatch(/^BEGIN:VCALENDAR/);
      expect(ics).toMatch(/END:VCALENDAR\s*$/);
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('PRODID:-//Museo//Museum Exhibits Calendar//EN');
    });

    it('contains one VEVENT per LA exhibit with dates', () => {
      const exhibitsWithDates = laExhibits.filter(e => e.startDate || e.endDate);
      const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
      expect(eventCount).toBe(exhibitsWithDates.length);
    });

    it('uses America/Los_Angeles timezone for all events', () => {
      const tzMatches = ics.match(/X-MUSEUM-TIMEZONE:(.+)/g) || [];
      for (const match of tzMatches) {
        expect(match).toBe('X-MUSEUM-TIMEZONE:America/Los_Angeles');
      }
      // No NYC timezone should appear
      expect(ics).not.toContain('America/New_York');
    });

    it('preserves exact date values without timezone shift', () => {
      for (const exhibit of laExhibits) {
        if (!exhibit.startDate && !exhibit.endDate) continue;

        if (exhibit.startDate) {
          const expected = exhibit.startDate.replace(/-/g, '');
          expect(ics).toContain(`DTSTART;VALUE=DATE:${expected}`);
        }
        if (exhibit.endDate) {
          const expected = exhibit.endDate.replace(/-/g, '');
          expect(ics).toContain(`DTEND;VALUE=DATE:${expected}`);
        }
      }
    });

    it('uses all-day date format (YYYYMMDD) with no time component', () => {
      const dtstarts = ics.match(/DTSTART;VALUE=DATE:\d+/g) || [];
      for (const dt of dtstarts) {
        const dateVal = dt.split(':')[1];
        expect(dateVal).toHaveLength(8);
        expect(dateVal).toMatch(/^\d{8}$/);
      }
    });

    it('includes correct museum names and locations for LA venues', () => {
      const laMuseumNames = museums
        .filter(m => m.city === 'los-angeles')
        .map(m => m.name);

      for (const name of laMuseumNames) {
        // Each museum with exhibits should appear in LOCATION fields
        const hasExhibits = laExhibits.some(
          e => museums.find(m => m.id === e.museumId)?.name === name
        );
        if (hasExhibits) {
          expect(ics).toContain(name);
        }
      }
    });

    it('includes exhibit titles in SUMMARY fields', () => {
      for (const exhibit of laExhibits) {
        if (!exhibit.startDate && !exhibit.endDate) continue;
        expect(ics).toContain(`SUMMARY:${exhibit.title}`);
      }
    });

    it('includes exhibit URLs when present', () => {
      const exhibitsWithUrls = laExhibits.filter(e => e.url && (e.startDate || e.endDate));
      for (const exhibit of exhibitsWithUrls) {
        expect(ics).toContain(`URL:${exhibit.url}`);
      }
    });

    it('has unique UIDs for each event', () => {
      const uids = ics.match(/UID:(.+)/g) || [];
      const uniqueUids = new Set(uids);
      expect(uniqueUids.size).toBe(uids.length);
    });
  });

  describe('ICS generation with a subset of selected exhibits', () => {
    // Simulate selecting first 3 LA exhibits (like a user picking favorites)
    const selected = sortByClosingSoonest(laExhibits).slice(0, 3);
    const ics = generateICS(selected);

    it('only includes selected exhibits, not all LA exhibits', () => {
      const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
      expect(eventCount).toBe(selected.length);
    });

    it('each selected exhibit has correct date, title, and location', () => {
      for (const exhibit of selected) {
        const museum = museums.find(m => m.id === exhibit.museumId);
        expect(ics).toContain(`SUMMARY:${exhibit.title}`);
        expect(ics).toContain(`LOCATION:${museum!.name}, ${museum!.location}`);

        if (exhibit.startDate) {
          expect(ics).toContain(`DTSTART;VALUE=DATE:${exhibit.startDate.replace(/-/g, '')}`);
        }
        if (exhibit.endDate) {
          expect(ics).toContain(`DTEND;VALUE=DATE:${exhibit.endDate.replace(/-/g, '')}`);
        }
      }
    });

    it('all events use America/Los_Angeles timezone', () => {
      const tzMatches = ics.match(/X-MUSEUM-TIMEZONE:(.+)/g) || [];
      expect(tzMatches).toHaveLength(selected.length);
      for (const match of tzMatches) {
        expect(match).toBe('X-MUSEUM-TIMEZONE:America/Los_Angeles');
      }
    });
  });

  describe('date boundary correctness', () => {
    it('March 31 end date stays March 31 in ICS output', () => {
      const marchExhibit: Exhibit = {
        id: 'test-march-boundary',
        museumId: 'lacma',
        title: 'March Boundary Test',
        description: 'Test',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        imageUrl: '',
        category: 'Art',
        url: '',
      };
      const ics = generateICS([marchExhibit]);
      expect(ics).toContain('DTEND;VALUE=DATE:20260331');
      expect(ics).not.toContain('DTEND;VALUE=DATE:20260401');
    });

    it('January 1 start date stays January 1 in ICS output', () => {
      const janExhibit: Exhibit = {
        id: 'test-jan-boundary',
        museumId: 'getty',
        title: 'New Year Exhibit',
        description: 'Test',
        startDate: '2026-01-01',
        endDate: '2026-04-15',
        imageUrl: '',
        category: 'Art',
        url: '',
      };
      const ics = generateICS([janExhibit]);
      expect(ics).toContain('DTSTART;VALUE=DATE:20260101');
      expect(ics).not.toContain('DTSTART;VALUE=DATE:20251231');
    });

    it('end-of-year dates are preserved across year boundary', () => {
      const yearEndExhibit: Exhibit = {
        id: 'test-year-boundary',
        museumId: 'broad',
        title: 'Year Boundary Exhibit',
        description: 'Test',
        startDate: '2025-11-15',
        endDate: '2026-02-28',
        imageUrl: '',
        category: 'Art',
        url: '',
      };
      const ics = generateICS([yearEndExhibit]);
      expect(ics).toContain('DTSTART;VALUE=DATE:20251115');
      expect(ics).toContain('DTEND;VALUE=DATE:20260228');
    });
  });
});
