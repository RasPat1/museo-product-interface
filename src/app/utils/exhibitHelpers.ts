import { differenceInDays } from 'date-fns';
import type { Exhibit } from '../types';

const LEAVING_SOON_DAYS = 45;

export function isLeavingSoon(endDate: string, today: Date = new Date()): boolean {
  const days = differenceInDays(new Date(endDate), today);
  return days >= 0 && days <= LEAVING_SOON_DAYS;
}

export function sortByClosingSoonest(exhibits: Exhibit[]): Exhibit[] {
  return [...exhibits].sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  );
}
