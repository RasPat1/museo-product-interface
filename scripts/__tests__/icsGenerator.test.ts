import { describe, it, expect } from 'vitest';
import { generateICS } from '../../src/app/utils/icsGenerator';
import type { Exhibit } from '../../src/app/types/index';

const exhibitWithUrl: Exhibit = {
  id: 'getty-test-exhibit',
  museumId: 'getty',
  title: 'Test Exhibition',
  description: 'A wonderful exhibition',
  startDate: '2026-03-01',
  endDate: '2026-09-01',
  imageUrl: 'https://example.com/img.jpg',
  category: 'Art',
  url: 'https://www.getty.edu/exhibitions/test-exhibit',
};

const exhibitWithoutUrl: Exhibit = {
  id: 'lacma-no-url',
  museumId: 'lacma',
  title: 'No URL Exhibit',
  description: 'An exhibit without a link',
  startDate: '2026-04-01',
  endDate: '2026-08-01',
  imageUrl: '',
  category: 'Photography',
  url: '',
};

describe('generateICS', () => {
  it('includes URL: field when exhibit has a url', () => {
    const ics = generateICS([exhibitWithUrl]);
    expect(ics).toContain('URL:https://www.getty.edu/exhibitions/test-exhibit');
  });

  it('includes url in DESCRIPTION when exhibit has a url', () => {
    const ics = generateICS([exhibitWithUrl]);
    expect(ics).toContain('More info: https://www.getty.edu/exhibitions/test-exhibit');
  });

  it('omits URL: field when exhibit has no url', () => {
    const ics = generateICS([exhibitWithoutUrl]);
    expect(ics).not.toMatch(/^URL:/m);
  });

  it('omits "More info" from DESCRIPTION when exhibit has no url', () => {
    const ics = generateICS([exhibitWithoutUrl]);
    expect(ics).not.toContain('More info:');
  });

  it('generates valid VCALENDAR structure', () => {
    const ics = generateICS([exhibitWithUrl]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
  });

  it('includes correct dates and title', () => {
    const ics = generateICS([exhibitWithUrl]);
    expect(ics).toContain('DTSTART;VALUE=DATE:20260301');
    expect(ics).toContain('DTEND;VALUE=DATE:20260901');
    expect(ics).toContain('SUMMARY:Test Exhibition');
  });

  it('includes museum name and location', () => {
    const ics = generateICS([exhibitWithUrl]);
    expect(ics).toContain('LOCATION:The Getty Center, Brentwood, Los Angeles');
  });

  it('skips exhibits with no start or end date', () => {
    const noDateExhibit: Exhibit = {
      id: 'moma-no-dates',
      museumId: 'moma',
      title: 'No Dates Exhibit',
      description: 'Missing both dates',
      startDate: '',
      endDate: '',
      imageUrl: '',
      category: 'Art',
      url: '',
    };
    const ics = generateICS([noDateExhibit]);
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  it('uses today as start date when startDate is empty', () => {
    const noStartExhibit: Exhibit = {
      id: 'moma-no-start',
      museumId: 'moma',
      title: 'Through Only',
      description: 'Has end date but no start',
      startDate: '',
      endDate: '2026-07-05',
      imageUrl: '',
      category: 'Art',
      url: '',
    };
    const ics = generateICS([noStartExhibit]);
    const now = new Date();
    const today = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    expect(ics).toContain(`DTSTART;VALUE=DATE:${today}`);
    expect(ics).toContain('DTEND;VALUE=DATE:20260705');
    expect(ics).toContain('SUMMARY:Through Only');
  });

  it('handles multiple exhibits with mixed url presence', () => {
    const ics = generateICS([exhibitWithUrl, exhibitWithoutUrl]);

    // Count URL: fields - should only be one (for the exhibit that has a URL)
    const urlFieldMatches = ics.match(/\r\nURL:/g);
    expect(urlFieldMatches).toHaveLength(1);

    // Both events should be present
    expect(ics).toContain('SUMMARY:Test Exhibition');
    expect(ics).toContain('SUMMARY:No URL Exhibit');
  });

  it('does not include a hardcoded X-WR-TIMEZONE header', () => {
    const ics = generateICS([exhibitWithUrl]);
    expect(ics).not.toContain('X-WR-TIMEZONE');
  });

  it('preserves exact date digits without timezone conversion', () => {
    // March 31 should stay as 20260331, not become 20260401
    const exhibit: Exhibit = {
      id: 'met-boundary',
      museumId: 'met',
      title: 'March Boundary Test',
      description: 'Testing end-of-month',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      imageUrl: '',
      category: 'Art',
      url: '',
    };
    const ics = generateICS([exhibit]);
    expect(ics).toContain('DTSTART;VALUE=DATE:20260301');
    expect(ics).toContain('DTEND;VALUE=DATE:20260331');
  });

  it('preserves January 1st dates correctly', () => {
    const exhibit: Exhibit = {
      id: 'met-new-year',
      museumId: 'met',
      title: 'New Year Boundary',
      description: 'Testing year boundary',
      startDate: '2025-12-15',
      endDate: '2026-01-01',
      imageUrl: '',
      category: 'Art',
      url: '',
    };
    const ics = generateICS([exhibit]);
    expect(ics).toContain('DTSTART;VALUE=DATE:20251215');
    expect(ics).toContain('DTEND;VALUE=DATE:20260101');
  });

  it('includes museum timezone as X-MUSEUM-TIMEZONE for LA museum', () => {
    const ics = generateICS([exhibitWithUrl]); // getty = LA
    expect(ics).toContain('X-MUSEUM-TIMEZONE:America/Los_Angeles');
  });

  it('includes museum timezone as X-MUSEUM-TIMEZONE for NYC museum', () => {
    const nycExhibit: Exhibit = {
      id: 'met-tz-test',
      museumId: 'met',
      title: 'NYC Timezone Test',
      description: 'A Met exhibit',
      startDate: '2026-05-01',
      endDate: '2026-08-01',
      imageUrl: '',
      category: 'Art',
      url: '',
    };
    const ics = generateICS([nycExhibit]);
    expect(ics).toContain('X-MUSEUM-TIMEZONE:America/New_York');
  });

  it('uses VALUE=DATE format for all-day events (no time component)', () => {
    const ics = generateICS([exhibitWithUrl]);
    // All-day events use VALUE=DATE with YYYYMMDD format (8 digits, no T or time)
    const dtstart = ics.match(/DTSTART;VALUE=DATE:(\d+)/);
    expect(dtstart).not.toBeNull();
    expect(dtstart![1]).toHaveLength(8);
    expect(dtstart![1]).not.toContain('T');
  });
});
