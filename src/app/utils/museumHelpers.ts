import type { Museum } from '../types';

export function getMuseumIdsByCity(museums: Museum[], city: string): string[] {
  return museums.filter(m => m.city === city).map(m => m.id);
}

export function getCitiesFromMuseums(museums: Museum[]): string[] {
  return Array.from(new Set(museums.map(m => m.city)));
}
