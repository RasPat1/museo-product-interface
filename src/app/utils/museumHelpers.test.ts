import { describe, it, expect } from 'vitest';
import { getMuseumIdsByCity, getCitiesFromMuseums } from './museumHelpers';
import type { Museum } from '../types';

function makeMuseum(overrides: Partial<Museum> = {}): Museum {
  return {
    id: 'museum-1',
    name: 'Test Museum',
    location: 'Test City',
    category: 'Art',
    city: 'los-angeles',
    imageUrl: 'https://example.com/img.jpg',
    description: 'A test museum',
    ...overrides,
  };
}

describe('getMuseumIdsByCity', () => {
  it('returns museum IDs matching the given city', () => {
    const museums = [
      makeMuseum({ id: 'lacma', city: 'los-angeles' }),
      makeMuseum({ id: 'met', city: 'new-york' }),
      makeMuseum({ id: 'getty', city: 'los-angeles' }),
    ];

    expect(getMuseumIdsByCity(museums, 'los-angeles')).toEqual(['lacma', 'getty']);
  });

  it('returns empty array when no museums match the city', () => {
    const museums = [
      makeMuseum({ id: 'lacma', city: 'los-angeles' }),
    ];

    expect(getMuseumIdsByCity(museums, 'new-york')).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(getMuseumIdsByCity([], 'los-angeles')).toEqual([]);
  });

  it('returns all museums when all belong to the same city', () => {
    const museums = [
      makeMuseum({ id: 'lacma', city: 'los-angeles' }),
      makeMuseum({ id: 'broad', city: 'los-angeles' }),
      makeMuseum({ id: 'moca', city: 'los-angeles' }),
    ];

    expect(getMuseumIdsByCity(museums, 'los-angeles')).toEqual(['lacma', 'broad', 'moca']);
  });
});

describe('getCitiesFromMuseums', () => {
  it('returns unique cities from museums', () => {
    const museums = [
      makeMuseum({ id: 'lacma', city: 'los-angeles' }),
      makeMuseum({ id: 'met', city: 'new-york' }),
      makeMuseum({ id: 'getty', city: 'los-angeles' }),
    ];

    expect(getCitiesFromMuseums(museums)).toEqual(['los-angeles', 'new-york']);
  });

  it('returns single city when all museums are in the same city', () => {
    const museums = [
      makeMuseum({ id: 'lacma', city: 'los-angeles' }),
      makeMuseum({ id: 'getty', city: 'los-angeles' }),
    ];

    expect(getCitiesFromMuseums(museums)).toEqual(['los-angeles']);
  });

  it('returns empty array for empty input', () => {
    expect(getCitiesFromMuseums([])).toEqual([]);
  });

  it('preserves insertion order (first occurrence)', () => {
    const museums = [
      makeMuseum({ id: 'met', city: 'new-york' }),
      makeMuseum({ id: 'lacma', city: 'los-angeles' }),
      makeMuseum({ id: 'moma', city: 'new-york' }),
    ];

    expect(getCitiesFromMuseums(museums)).toEqual(['new-york', 'los-angeles']);
  });
});
