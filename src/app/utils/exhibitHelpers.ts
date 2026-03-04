import { differenceInDays } from 'date-fns';
import type { Exhibit, CurationState } from '../types';

const LEAVING_SOON_DAYS = 45;

/**
 * Parse a YYYY-MM-DD string as a local date (not UTC).
 * new Date("2026-03-05") parses as UTC midnight, which shifts back a day
 * in US timezones. This avoids that by constructing a local date.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isLeavingSoon(endDate: string, today: Date = new Date()): boolean {
  if (!endDate) return false;
  const days = differenceInDays(parseLocalDate(endDate), today);
  return days >= 0 && days <= LEAVING_SOON_DAYS;
}

export function sortByClosingSoonest(exhibits: Exhibit[]): Exhibit[] {
  return [...exhibits].sort((a, b) => {
    // Exhibits without end dates sort to the end
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return parseLocalDate(a.endDate).getTime() - parseLocalDate(b.endDate).getTime();
  });
}

export function getMuseumIdsFromExhibits(exhibits: Exhibit[]): string[] {
  return Array.from(new Set(exhibits.map(e => e.museumId)));
}

export function clearInterestedExhibits(state: CurationState): CurationState {
  return { ...state, interestedExhibits: [] };
}
