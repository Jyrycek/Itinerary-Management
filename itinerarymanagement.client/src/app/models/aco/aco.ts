export class ACO {
  private distanceMatrix: number[][] = [];
  private pheromones: number[][] = [];
  private numberOfPlaces = 0;
  private numberOfAnts = 25;
  private alpha = 1.0;
  private beta = 6.0;
  private evaporationRate = 0.5;
  private random: () => number = Math.random;
  private fixedStartIndex: number;
  private fixedEndIndex: number;

  constructor(distanceMatrix: number[][], fixedStartIndex: number, fixedEndIndex: number) {
    this.distanceMatrix = distanceMatrix;
    this.numberOfPlaces = distanceMatrix.length;
    this.fixedStartIndex = fixedStartIndex;
    this.fixedEndIndex = fixedEndIndex;

    this.pheromones = Array.from({ length: this.numberOfPlaces }, () =>
      new Array(this.numberOfPlaces).fill(1.0)
    );
  }

  public optimize(iterations: number): number[] | null {
    let bestTour: number[] | null = null;
    let bestTourLength = Infinity;

    for (let iter = 0; iter < iterations; iter++) {
      const allTours: number[][] = [];
      const allTourLengths: number[] = [];

      for (let ant = 0; ant < this.numberOfAnts; ant++) {
        const tour = this.constructSolution();
        const tourLength = this.calculateTourLength(tour, this.distanceMatrix);

        allTours.push(tour);
        allTourLengths.push(tourLength);

        if (tourLength < bestTourLength) {
          bestTour = tour;
          bestTourLength = tourLength;
        }
      }

      this.updatePheromones(allTours, allTourLengths);
    }

    return bestTour;
  }

  private constructSolution(): number[] {
    const tour: number[] = [this.fixedStartIndex];
    const visited = new Set<number>(tour);

    while (tour.length < this.numberOfPlaces - 1) {
      const lastPlace = tour[tour.length - 1];
      const nextPlace = this.selectNextPlace(lastPlace, visited);
      tour.push(nextPlace);
      visited.add(nextPlace);
    }

    tour.push(this.fixedEndIndex);

    return tour;
  }

  private selectNextPlace(currentPlace: number, visited: Set<number>): number {
    const probabilities: number[] = Array(this.numberOfPlaces).fill(0);
    let sum = 0.0;

    for (let i = 0; i < this.numberOfPlaces; i++) {

      if (visited.has(i) || i === this.fixedEndIndex)
        continue;

      probabilities[i] =
        Math.pow(this.pheromones[currentPlace][i], this.alpha) *
        Math.pow(1.0 / this.distanceMatrix[currentPlace][i], this.beta);
      sum += probabilities[i];
    }

    let randomValue = this.random() * sum;

    for (let i = 0; i < this.numberOfPlaces; i++) {
      if (visited.has(i) || i === this.fixedEndIndex) continue;

      if (randomValue <= probabilities[i]) return i;

      randomValue -= probabilities[i];
    }

    throw new Error("No valid next place found");
  }

  private updatePheromones(allTours: number[][], allTourLengths: number[]): void {
    for (let i = 0; i < this.numberOfPlaces; i++) {
      for (let j = 0; j < this.numberOfPlaces; j++) {
        this.pheromones[i][j] *= 1 - this.evaporationRate;
      }
    }

    for (let t = 0; t < allTours.length; t++) {
      const tour = allTours[t];
      const tourLength = allTourLengths[t];

      for (let i = 0; i < tour.length - 1; i++) {
        const placeA = tour[i];
        const placeB = tour[i + 1];

        this.pheromones[placeA][placeB] += 1.0 / tourLength;
        this.pheromones[placeB][placeA] += 1.0 / tourLength;
      }
    }
  }

  private calculateTourLength(tour: number[], distanceMatrix: number[][]): number {
    let length = 0.0;
    for (let i = 0; i < tour.length - 1; i++) {
      length += distanceMatrix[tour[i]][tour[i + 1]];
    }
    return length;
  }
}

