import { Injectable, inject } from '@angular/core';
import { ItineraryDay } from '../../../models/project/itinerary-day';
import { ACO } from '../../../models/aco/aco';
import { firstValueFrom } from 'rxjs';
import { RouteService } from '../map/route.service';
import { Coordinate } from '../../../models/route/route-coordinate';

@Injectable({
  providedIn: 'root'
})
export class DistanceService {
  private readonly routeService = inject(RouteService);

  public async getBestPathWithStartEnd(itineraryDay: ItineraryDay): Promise<number[] | null> {
    const places = itineraryDay.places;

    if (places.length <= 2) {
      return null;
    }

    const placeCoordinates: Coordinate[] = places.map(place => ({
      latitude: place.latitude,
      longitude: place.longitude,
    }));

    try {
      const distanceMatrix = await firstValueFrom(this.routeService.calculateDistanceMatrix(placeCoordinates));

      const startIndex = 0;
      const endIndex = places.length - 1;

      const acoService = new ACO(distanceMatrix, startIndex, endIndex);
      return acoService.optimize(100);

    } catch (error) {
      console.error("Error in DistanceService:", error);
      return null;
    }
  }

  public recalculateDistances(day: any) {
    day.distances = [];
    for (let i = 0; i < day.places.length - 1; i++) {
      const place1 = day.places[i];
      const place2 = day.places[i + 1];
      const distance = DistanceService.haversineDistance(place1.latitude, place1.longitude, place2.latitude, place2.longitude);
      day.distances.push(distance);
    }
  }

  public static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
