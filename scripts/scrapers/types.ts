export interface ScrapedExhibit {
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  imageUrl: string | null;
  category: string | null;
  url: string | null;
}

export interface ScraperResult {
  museumId: string;
  exhibits: ScrapedExhibit[];
  errors: string[];
}

export type ScraperFn = () => Promise<ScraperResult>;
