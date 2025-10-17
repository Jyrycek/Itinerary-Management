export interface ItineraryDayTransportSegment {
  itineraryDayId: number;
  fromPlaceId: number;
  toPlaceId: number;
  transportModeId: number;
  transportMode?: TransportMode;
}

export interface TransportMode {
  id: number;
  name: string;
}
