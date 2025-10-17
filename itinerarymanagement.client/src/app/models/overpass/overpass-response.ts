export interface OverpassResponse {
  nodes?: Element[];  // Uzly bez tagů
  others?: Element[]; // Ostatní elementy s tagy
}

export interface Element {
  areCoordinatesCertain: boolean;
  id: string;
  type?: string;
  lat?: number; 
  lon?: number; 
  tags?: Tags; 
  nodes?: string[];
}

export interface Tags {
  isPageId: boolean;
  name?: string;
  nameCs?: string;
  nameEn?: string;
  wikidata?: string;
  wikipedia?: string;
  lang?: string;
  openingHours?: string;
  website?: string;
}

