export class ACO {
  distanceMatrix: number[][];
  visitTimes: number[];
  days: number;
  iterations: number;
  ants: number;
  alpha: number;
  beta: number;
  rho: number;
  q: number;
  pheromones: number[][];
  maxDayTimes: number[];

  constructor(distanceMatrix: number[][], visitTimes: number[], days: number, dayTimes: { start: number, end: number }[], iterations = 500, ants = 50, alpha = 1, beta = 2, rho = 0.5, q = 100) {
    this.distanceMatrix = distanceMatrix;
    this.visitTimes = visitTimes;
    this.days = days;
    this.iterations = iterations;
    this.ants = ants;
    this.alpha = alpha;
    this.beta = beta;
    this.rho = rho;
    this.q = q;
    this.maxDayTimes = dayTimes.map(day => (day.end - day.start) * 60);
    this.pheromones = this.initializePheromones();
  }

  private initializePheromones(): number[][] {
    return Array.from({ length: this.distanceMatrix.length }, () => Array(this.distanceMatrix.length).fill(1 / this.distanceMatrix.length));
  }

  private computeProbabilities(lastLoc: number, unvisited: number[]): number[] {
    const probabilities = unvisited.map(i => {
      const heuristic = 1 / (this.distanceMatrix[lastLoc][i] + 1e-10);
      return (this.pheromones[lastLoc][i] ** this.alpha) * (heuristic ** this.beta);
    });
    const sum = probabilities.reduce((a, b) => a + b, 0);
    return probabilities.map(p => p / sum);
  }

  private chooseLocation(unvisited: number[], probabilities: number[]): number {
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (rand < cumulative) return unvisited[i];
    }
    return unvisited[unvisited.length - 1];
  }

  private updatePheromones(solutions: number[][][], costs: number[]): void {
    this.pheromones = this.pheromones.map(row => row.map(p => p * (1 - this.rho)));
    solutions.forEach((solution, k) => {
      solution.forEach(dayRoute => {
        for (let i = 0; i < dayRoute.length - 1; i++) {
          this.pheromones[dayRoute[i]][dayRoute[i + 1]] += this.q / costs[k];
        }
      });
    });
  }

  public run(): number[][] {
    let bestSolution: number[][] = [];
    let bestCost = Infinity;

    for (let iter = 0; iter < this.iterations; iter++) {
      const solutions: number[][][] = [];
      const costs: number[] = [];

      for (let ant = 0; ant < this.ants; ant++) {
        const visited = Array(this.distanceMatrix.length).fill(false);
        const startLocations = [...Array(this.days)].map(() => {
          let startLoc;
          do {
            startLoc = Math.floor(Math.random() * this.distanceMatrix.length);
          } while (visited[startLoc]);
          visited[startLoc] = true;
          return startLoc;
        });

        const solution = startLocations.map(start => [start, start]);
        const remainingTime = [...this.maxDayTimes];

        while (visited.includes(false)) {
          const maxTimeIndex = remainingTime.indexOf(Math.max(...remainingTime));
          if (visited.every(v => v)) break;
          const lastLoc = solution[maxTimeIndex][solution[maxTimeIndex].length - 2];
          const unvisited = this.distanceMatrix.map((_, i) => i).filter(i => !visited[i] && i !== startLocations[maxTimeIndex]);
          if (unvisited.length > 0) {
            const probabilities = this.computeProbabilities(lastLoc, unvisited);
            const chosen = this.chooseLocation(unvisited, probabilities);
            solution[maxTimeIndex].splice(-1, 0, chosen);
            visited[chosen] = true;
            remainingTime[maxTimeIndex] -= (this.distanceMatrix[lastLoc][chosen] / 8) + this.visitTimes[chosen];
          }
        }

        const cost = solution.reduce((total, dayRoute, dayIndex) => {
          let dayTime = 0;
          for (let i = 0; i < dayRoute.length - 1; i++) {
            dayTime += this.distanceMatrix[dayRoute[i]][dayRoute[i + 1]] / 8;
            if (i < dayRoute.length - 2) dayTime += this.visitTimes[dayRoute[i + 1]];
          }
          const penalty = dayTime > this.maxDayTimes[dayIndex] ? (dayTime - this.maxDayTimes[dayIndex]) * 10 : 0;
          return total + dayTime + penalty;
        }, 0);

        solutions.push(solution);
        costs.push(cost);
        if (cost < bestCost) {
          bestCost = cost;
          bestSolution = solution;
        }
      }

      this.updatePheromones(solutions, costs);
    }

    return bestSolution;
  }
}
