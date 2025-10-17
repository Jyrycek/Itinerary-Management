import { Place } from "../../models/project/place-project";
import { Tag } from "../../models/project/place-tag";

export class Utils {
  public static hasChanges(original: Place, current: Place): boolean {

    if (!original.tags || !current.tags) return true;

    if (
      original.title !== current.title ||
      original.description !== current.description ||
      original.latitude !== current.latitude ||
      original.longitude !== current.longitude ||
      original.openingHours !== current.openingHours ||
      original.website !== current.website ||
      original.visitDuration !== current.visitDuration) {
      return true;
    }

    if (!this.areTagsEqual(original.tags ?? [], current.tags ?? [])) {
      return true;
    }
    return false;
  }

  private static areTagsEqual(tags1: Tag[], tags2: Tag[]): boolean {
    if (tags1.length !== tags2.length) return false;

    const set1 = new Set(tags1.map(tag => `${tag.name}:${tag.color}`));
    const set2 = new Set(tags2.map(tag => `${tag.name}:${tag.color}`));

    for (const tag of set1) {
      if (!set2.has(tag)) return false;
    }

    for (const tag of set2) {
      if (!set1.has(tag)) return false;
    }

    return true;
  }

  public static decimalToDMS(decimal: number, isLatitude: boolean): string {
    const isNegative = decimal < 0;
    const absDecimal = Math.abs(decimal);

    const degrees = Math.floor(absDecimal);
    const minutes = Math.floor((absDecimal - degrees) * 60);
    const seconds = ((absDecimal - degrees - minutes / 60) * 3600).toFixed(0);

    const direction = isLatitude
      ? isNegative ? 'S' : 'N'
      : isNegative ? 'W' : 'E';

    return `${degrees}°${minutes}'${seconds}"${direction}`;
  }

}
