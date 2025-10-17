import { Proximity } from "./route-proximity";

export class OverpassRequest {
  query: string;
  proximity: Proximity;

  constructor(query: string, proximity: Proximity) {
    this.query = query;
    this.proximity = proximity;
  }
}
