export class Project {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  imageUrl: string;

  constructor(id: number, title: string, startDate: Date, endDate: Date, imageUrl: string) {
    this.id = id;
    this.title = title;
    this.startDate = startDate;
    this.endDate = endDate;
    this.imageUrl = imageUrl;
  }
}
export class ProjectDTO {
  title: string;
  startDate: Date;
  endDate: Date;

  constructor(title: string, startDate: Date, endDate: Date) {
    this.title = title;
    this.startDate = startDate;
    this.endDate = endDate;
  }
}
