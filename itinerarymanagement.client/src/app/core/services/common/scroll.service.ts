import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  public scrollToDay(dayId: number) {
    const element = document.getElementById('day-' + dayId) as HTMLElement | null;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  public scrollToPlace(placeId: number) {
    const element = document.getElementById('place-' + placeId) as HTMLElement | null;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  public async scrollToTop() {
    const scrollableDiv = document.querySelector('#scroll-container') as HTMLElement;
    if (scrollableDiv) {
      scrollableDiv.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
