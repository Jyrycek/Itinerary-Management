import { Injectable } from '@angular/core';
import { ItineraryDay } from '../../../models/project/itinerary-day';

@Injectable({
  providedIn: 'root'
})
export class PlaceItinerarySharedService {
  private readonly visibleDays = new Set<ItineraryDay>();

  public toggleDayContent(day: ItineraryDay): void {
    if (!day.places?.length) return;

    if (this.visibleDays.has(day)) {
      this.visibleDays.delete(day);
    } else {
      this.visibleDays.add(day);
    }
  }

  public isDayContentVisible(day: ItineraryDay): boolean {
    return this.visibleDays.has(day);
  }
}
