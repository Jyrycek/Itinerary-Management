export interface RouteRequest {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  vehicleType?: VehicleType;
}
export enum VehicleType {
  Pedestrian = 0,
  Car = 1,
  Bicycle = 2
}
