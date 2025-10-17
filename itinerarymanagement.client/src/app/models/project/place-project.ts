import { Tag, TagDTO } from "./place-tag";

export class Place {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  order: number;
  placeImages: PlaceImage[];
  tags?: Tag[];
  currentShownImageIndex: number;
  visitDuration?: number;
  website?: string;
  openingHours?: string;
  loadingImage: boolean;

  constructor(id: number, title: string, description: string, latitude: number, longtitude: number, order: number, images: PlaceImage[], visitduration?: number, tags: Tag[] = [], website = "", openinghours = "", loadingImage = false) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.latitude = latitude;
    this.longitude = longtitude;
    this.order = order;
    this.placeImages = images;
    this.visitDuration = visitduration;
    this.tags = tags;
    this.currentShownImageIndex = images.length > 0 ? 0 : -1;
    this.website = website;
    this.openingHours = openinghours;
    this.loadingImage = loadingImage;
  }

  public addTag(tagTitle: string, tagColor: string): void {
    if (!this.tags) {
      this.tags = [];
    }
    const tagExists = this.tags.some(tag => tag.name === tagTitle);
    if (!tagExists) {
      this.tags.push(new Tag(0, tagTitle, tagColor));
    }
  }

  public editTag(tagTitle: string, tagColor: string): void {
    const tagExists = this.tags?.some(tag => tag.name === tagTitle);
    if (!tagExists) {
      this.tags?.push(new Tag(0, tagTitle, tagColor));
    }
  }

  public removeTag(tagToRemove: Tag): void {
    if (!this.tags) {
      return;
    }
    const index = this.tags.indexOf(tagToRemove);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  public nextImage(): void {
    if (this.placeImages.length === 0) return;
    this.currentShownImageIndex = (this.currentShownImageIndex + 1) % this.placeImages.length;
    this.loadingImage = true;
  }

  public prevImage(): void {
    if (this.placeImages.length === 0) return;
    this.currentShownImageIndex = (this.currentShownImageIndex - 1 + this.placeImages.length) % this.placeImages.length;
    this.loadingImage = true;
  }
}

export class PlaceImage {
  id: number;
  imageUrl: string;

  constructor(id = 0, imageUrl = "") {
    this.id = id;
    this.imageUrl = imageUrl;
  }
}

export class PlaceDTO {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  order: number;
  placeImages: PlaceImage[];
  tags?: TagDTO[];
  currentShownImageIndex: number;
  visitDuration?: number;
  website?: string;
  openingHours?: string;

  constructor(title = '', description = '', latitude = 0, longtitude = 0, order = 1, images: PlaceImage[] = [], visitduration = 0, tags: TagDTO[] = [], website = "", openinghours = "") {
    this.title = title;
    this.description = description;
    this.latitude = latitude;
    this.longitude = longtitude;
    this.order = order;
    this.placeImages = images;
    this.tags = tags;
    this.visitDuration = visitduration;
    this.currentShownImageIndex = 0;
    this.website = website;
    this.openingHours = openinghours;
  }

  public addTag(tagTitle: string, tagColor: string): void {
    if (!this.tags) {
      this.tags = [];
    }
    const tagExists = this.tags.some(tag => tag.name === tagTitle);
    if (!tagExists) {
      this.tags.push(new TagDTO(tagTitle, tagColor));
    }
  }

  public editTag(tagTitle: string, tagColor: string): void {
    const tagExists = this.tags?.some(tag => tag.name === tagTitle);
    if (!tagExists) {
      this.tags?.push(new TagDTO(tagTitle, tagColor));
    }
  }

  public removeTag(tagToRemove: TagDTO): void {
    if (!this.tags) {
      return;
    }
    const index = this.tags.indexOf(tagToRemove);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }
}
