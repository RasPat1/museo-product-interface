import { differenceInDays } from 'date-fns';
import type { Exhibit, CurationState } from '../types';

const LEAVING_SOON_DAYS = 45;

export function isLeavingSoon(endDate: string, today: Date = new Date()): boolean {
  if (!endDate) return false;
  const days = differenceInDays(new Date(endDate), today);
  return days >= 0 && days <= LEAVING_SOON_DAYS;
}

export function sortByClosingSoonest(exhibits: Exhibit[]): Exhibit[] {
  return [...exhibits].sort((a, b) => {
    // Exhibits without end dates sort to the end
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
  });
}

export function getMuseumIdsFromExhibits(exhibits: Exhibit[]): string[] {
  return Array.from(new Set(exhibits.map(e => e.museumId)));
}

export function clearInterestedExhibits(state: CurationState): CurationState {
  return { ...state, interestedExhibits: [] };
}
