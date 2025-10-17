export class Tag {
  id: number;
  name: string;
  color = "#000000";
  constructor(id: number, name: string, color: string) {
    this.id = id;
    this.name = name;
    this.color = color;
  }
}
export class TagDTO {
  name: string;
  color = "#000000";
  constructor(name: string, color: string) {
    this.name = name;
    this.color = color;
  }
}
