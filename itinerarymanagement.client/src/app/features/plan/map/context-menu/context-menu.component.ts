import { Component, Input, output } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
    selector: 'app-context-menu',
    templateUrl: './context-menu.component.html',
    styleUrls: ['./context-menu.component.css'],
    standalone: true,
    imports: [NgStyle]
})
export class ContextMenuComponent {
  @Input() lat = 0;
  @Input() lng = 0;
  @Input() x = 0;
  @Input() y = 0;
  readonly addPlace = output<{
    lat: number;
    lng: number;
}>();
  readonly showCoordinates = output<{
    lat: number;
    lng: number;
}>();

  closeMenu() {
    const menu = document.getElementById('context-menu');
    if (menu) {
      menu.style.display = 'none';
    }
  }

  onAddPlaceClick() {
    this.addPlace.emit({ lat: this.lat, lng: this.lng });
    this.closeMenu();
  }
}
