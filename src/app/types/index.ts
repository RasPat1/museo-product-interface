export interface Museum {
  id: string;
  name: string;
  location: string;
  category: string;
  imageUrl: string;
  description: string;
}

export interface Exhibit {
  id: string;
  museumId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  category: string;
}

export interface CurationState {
  selectedMuseums: string[];
  interestedExhibits: string[];
}
