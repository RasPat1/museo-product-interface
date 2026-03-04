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
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
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
});
