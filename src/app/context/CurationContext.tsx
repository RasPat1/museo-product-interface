import React, { createContext, useContext, useState, useEffect } from 'react';
import { CurationState } from '../types';

interface CurationContextType {
  curationState: CurationState;
  selectMuseums: (museumIds: string[]) => void;
  toggleMuseum: (museumId: string) => void;
  toggleExhibit: (exhibitId: string) => void;
  isMuseumSelected: (museumId: string) => boolean;
  isExhibitInterested: (exhibitId: string) => boolean;
}

const CurationContext = createContext<CurationContextType | undefined>(undefined);

export function CurationProvider({ children }: { children: React.ReactNode }) {
  const [curationState, setCurationState] = useState<CurationState>(() => {
    const saved = localStorage.getItem('museo-curation');
    return saved ? JSON.parse(saved) : { selectedMuseums: [], interestedExhibits: [] };
  });

  useEffect(() => {
    localStorage.setItem('museo-curation', JSON.stringify(curationState));
  }, [curationState]);

  const selectMuseums = (museumIds: string[]) => {
    setCurationState(prev => ({
      ...prev,
      selectedMuseums: museumIds,
    }));
  };

  const toggleMuseum = (museumId: string) => {
    setCurationState(prev => ({
      ...prev,
      selectedMuseums: prev.selectedMuseums.includes(museumId)
        ? prev.selectedMuseums.filter(id => id !== museumId)
        : [...prev.selectedMuseums, museumId],
    }));
  };

  const toggleExhibit = (exhibitId: string) => {
    setCurationState(prev => ({
      ...prev,
      interestedExhibits: prev.interestedExhibits.includes(exhibitId)
        ? prev.interestedExhibits.filter(id => id !== exhibitId)
        : [...prev.interestedExhibits, exhibitId],
    }));
  };

  const isMuseumSelected = (museumId: string) => {
    return curationState.selectedMuseums.includes(museumId);
  };

  const isExhibitInterested = (exhibitId: string) => {
    return curationState.interestedExhibits.includes(exhibitId);
  };

  return (
    <CurationContext.Provider
      value={{
        curationState,
        selectMuseums,
        toggleMuseum,
        toggleExhibit,
        isMuseumSelected,
        isExhibitInterested,
      }}
    >
      {children}
    </CurationContext.Provider>
  );
}

export function useCuration() {
  const context = useContext(CurationContext);
  if (!context) {
    throw new Error('useCuration must be used within CurationProvider');
  }
  return context;
}
