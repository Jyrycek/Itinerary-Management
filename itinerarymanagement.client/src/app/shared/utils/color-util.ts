export class ColorUtil {
  public static getRandomColor(dayColors: Record<string, string>): string {
    let color = "#000000";
    let isColorSimilar = true;
    let attempts = 0;

    while (isColorSimilar && attempts < 10) {
      color = "#";
      for (let i = 0; i < 3; i++) {
        const value = Math.floor(Math.random() * 151) + 50;
        color += value.toString(16).padStart(2, '0');
      }

      isColorSimilar = this.isColorTooSimilar(color, dayColors);
      attempts++;
    }

    return color;
  }

  private static isColorTooSimilar(color: string, dayColors: Record<string, string>): boolean {
    for (const existingColor of Object.values(dayColors)) {
      const diff = this.colorDifference(existingColor, color);
      if (diff < 70) {
        return true;
      }
    }
    return false;
  }

  private static colorDifference(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    const rDiff = Math.abs(rgb1.r - rgb2.r);
    const gDiff = Math.abs(rgb1.g - rgb2.g);
    const bDiff = Math.abs(rgb1.b - rgb2.b);

    return rDiff + gDiff + bDiff;
  }

  private static hexToRgb(hex: string): { r: number, g: number, b: number } {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return { r, g, b };
  }
}
