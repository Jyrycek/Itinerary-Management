import { Place } from "./place-project";

export type VehicleType = 'Pedestrian' | 'Car' | 'Bicycle';

export class ItineraryDay {
  id: number;
  dayDate: Date;
  formattedDate: string;
  formattedFullDate: string;
  places: Place[];
  placeSelections: Record<string, boolean>;
  dayPlaces: ItineraryDayPlaces[];
  isLoadingPath = false;
  startTime: string;
  endTime: string;

  constructor(id: number, dayDate: Date, places: Place[] = [], dayPlaces: ItineraryDayPlaces[] = [], startTime = '08:00', endTime = '20:00') {
    this.id = id;
    this.dayDate = dayDate;
    this.places = places;
    this.dayPlaces = dayPlaces; 
    this.formattedDate = this.formatDate();
    this.formattedFullDate = this.formatFullDate();
    this.placeSelections = this.createPlaceSelections();
    this.startTime = startTime;
    this.endTime = endTime;
  }
  get monthsOfYear(): string[] {
    return ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
  }

  private formatDate(): string {
    const monthsOfYear = this.monthsOfYear;

    const day = this.dayDate.getDate().toString();
    const monthFull = monthsOfYear[this.dayDate.getMonth()];
    return `${day}. ${monthFull}`;
  }

  private formatFullDate(): string {
    const daysOfWeekFull = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
    const monthsOfYear = this.monthsOfYear;

    const dayOfWeekFull = daysOfWeekFull[this.dayDate.getDay()];
    const dayNotZero = this.dayDate.getDate().toString();
    const monthFull = monthsOfYear[this.dayDate.getMonth()];

    return `${dayOfWeekFull}, ${dayNotZero}. ${monthFull}`;
  }

  private createPlaceSelections(): Record<string, boolean> {
    return this.places.reduce((acc: Record<string, boolean>, place: Place) => {
      acc[place.id] = true;
      return acc;
    }, {});
  }
}

export class Itinerary {
  id: number;
  startDate: Date;
  endDate: Date;
  itineraryDays: ItineraryDay[];

  constructor(id: number, startDate: Date, endDate: Date, itineraryDays: ItineraryDay[]) {
    this.id = id;
    this.startDate = startDate;
    this.endDate = endDate;
    this.itineraryDays = itineraryDays;
  }
}

export class ItineraryDayPlaces {
  itineraryDayId: number;
  placeId: number;
  order: number
  constructor(itineraryDayId: number, placeId: number, order: number) {
    this.itineraryDayId = itineraryDayId;
    this.placeId = placeId;
    this.order = order;
  }
}
