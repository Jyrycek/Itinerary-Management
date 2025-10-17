import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, viewChild, viewChildren, AfterViewInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { MapService } from '../../../core/services/map/map.service';
import { DataService } from '../../../core/services/data.service';
import { PlaceManagementService } from '../../../core/services/plan/place-management.service';
import { ItineraryManagementService } from '../../../core/services/plan/itinerary-management.service';
import { Place } from '../../../models/project/place-project';
import { ScrollService } from '../../../core/services/common/scroll.service';
import { PlaceDaySortComponent } from './place-day-sort/place-day-sort.component';
import { NotificationService } from '../../../core/services/common/notification.service';
import { ItineraryDay } from '../../../models/project/itinerary-day';
import { MatNavList, MatListItem } from '@angular/material/list';
import { NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { PlaceListComponent } from './place-list/place-list.component';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ItineraryDayListComponent } from './itinerary-day-list/itinerary-day-list.component';
import { MapComponent } from '../map/map.component';

@Component({
    selector: 'app-plan-details',
    templateUrl: './plan-details.component.html',
    styleUrls: ['./plan-details.component.css'],
    standalone: true,
    imports: [MatNavList, MatListItem, NgClass, MatTooltip, PlaceListComponent, MatIconButton, MatIcon, ItineraryDayListComponent, MapComponent]
})
export class PlanDetailsComponent implements OnInit, AfterViewInit {
  private readonly cdr = inject(ChangeDetectorRef);
  public readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly itineraryManagementService = inject(ItineraryManagementService);
  private readonly mapService = inject(MapService);
  private readonly dataService = inject(DataService);
  private readonly placeManagementService = inject(PlaceManagementService);
  private readonly scrollService = inject(ScrollService);
  private readonly notificationService = inject(NotificationService);

  readonly sidenavContainer = viewChild<ElementRef>('sidenavContainer');
  readonly scrollContainer = viewChild.required<ElementRef>('scrollContainer');

  readonly sectionElements = viewChildren<ElementRef>('sectionElement');
  readonly dayElements = viewChildren<ElementRef>('dayElement');
  readonly placeElements = viewChildren<ElementRef>('placeElement');

  private isResizing = false;
  private initialSidenavWidth: number | null = null;
  public sidenavWidth = '150px';
  public isSidenavHidden = false;

  public activeItemId: string | null = null;
  public activeSectionId: string | null = null;

  public isMapVisible = false;

  public activeItineraryDayId: string | null = null;
  public activePlaceId: string | null = null;

  public menuItems = [
    { title: 'Místa', id: 'places', visible: true, sidenavExpanded: true },
    { title: 'Itinerář', id: 'itinerary', visible: true, sidenavExpanded: true }
  ];

  set itineraryDays(value: ItineraryDay[]) {
    this.dataService.itineraryDays = value;
  }
  get itineraryDays(): ItineraryDay[] {
    return this.dataService.itineraryDays;
  }
  set places(value: Place[]) {
    this.dataService.places = value;
  }
  get places(): Place[] {
    return this.dataService.places;
  }

  async ngOnInit() {
    this.dataService.projectId = this.route.snapshot.paramMap.get('id') as string;

    await this.placeManagementService.loadProjectPlaces();
    await this.itineraryManagementService.loadProjectDates();
    await this.itineraryManagementService.loadTransportSegments();

    if (window.innerWidth < 768) {
      this.toggleSidenav();
    }
    this.setDefaultActiveSection();
  }
  ngAfterViewInit() {
    this.scrollContainer().nativeElement.addEventListener('scroll', this.onScroll.bind(this));
  }

  onScroll() {
    this.checkActiveSection();
  }

  private setDefaultActiveSection() {
    if (!this.activeSectionId) {
      if (this.places.length > 0) {
        this.setActivePlace(this.places[0].id);
      } else if (this.itineraryDays.length > 0) {
        this.setActiveItineraryDay(this.itineraryDays[0].id);
      }
    }
  }
  private checkActiveSection() {
    const windowHeight = window.innerHeight;
    const topThird = windowHeight / 3;

    let foundActive = false;

    this.places.forEach(place => {
      const element = document.getElementById('place-' + place.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < topThird && rect.top >= 0;

        if (isVisible && !foundActive) {
          this.setActivePlace(place.id);
          foundActive = true;
        }
      }
    });

    if (!foundActive) {
      this.itineraryDays.forEach(day => {
        const element = document.getElementById('day-' + day.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const isVisible = rect.top < topThird && rect.top >= 0;

          if (isVisible) {
            this.setActiveItineraryDay(day.id);
            foundActive = true;
          }
        }
      });
    }
  }

  public setActiveItineraryDay(dayId: number): void {
    this.activePlaceId = null;
    this.activeItineraryDayId = dayId.toString();
  }

  public setActivePlace(placeId: number): void {
    this.activeItineraryDayId = null;
    this.activePlaceId = placeId.toString();
  }

  @HostListener('window:mousemove', ['$event'])
  public onMouseMove(event: MouseEvent) {
    const sidenavContainer = this.sidenavContainer();
    if (this.isResizing && this.initialSidenavWidth !== null && sidenavContainer) {
      const newWidth = event.clientX;
      sidenavContainer.nativeElement.style.width = `${newWidth}px`;
      this.mapService.resize();
    }
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp() {
    this.isResizing = false;
    this.initialSidenavWidth = null;
  }

  public scrollToDay(day: any) {
    this.scrollService.scrollToDay(day.id);
  }

  public scrollToPlace(place: any) {
    this.scrollService.scrollToPlace(place.id);
  }

  public handleItemClick(id: string) {
    const item = this.menuItems.find(menuItem => menuItem.id === id);

    if (item) {
      item.sidenavExpanded = !item.sidenavExpanded;
    }
  }

  public toggleSidenav() {
    this.isSidenavHidden = !this.isSidenavHidden;
    this.sidenavWidth = this.isSidenavHidden ? '0%' : '150px';
  }

  public onMouseDown(event: MouseEvent) {
    const sidenavContainer = this.sidenavContainer();
    if (sidenavContainer) {
      this.isResizing = true;
      this.initialSidenavWidth = sidenavContainer.nativeElement.offsetWidth;
      event.preventDefault();
    }
  }

  public toggleExpand(event: Event, item: any) {
    event.stopPropagation();
    item.expanded = !item.expanded;
    this.cdr.detectChanges();
  }

  public toggleSection(sectionId: string) {
    const item = this.menuItems.find(item => item.id === sectionId);
    if (item) {
      item.visible = !item.visible;
    }
  }

  // Funkce pro zjištění viditelnosti sekce
  public isSectionVisible(sectionId: string): boolean {
    const item = this.menuItems.find(item => item.id === sectionId);
    return item ? item.visible : true;
  }

  public toggleMap() {
    this.isMapVisible = !this.isMapVisible;
    const toggleButton = document.querySelector('.toggle-map-button');
    if (!toggleButton) {
      return;
    }

    if (this.isMapVisible) {
      toggleButton.classList.add('map-open');
    } else {
      toggleButton.classList.remove('map-open');
    }
  }
  public handleItemLeave() {
    this.activeItemId = null;
  }

  public openDialogAcoSort(): void {
    if (this.itineraryDays.length > this.places.length) {
      this.notificationService.showNotification("Počet dní je větší než počet míst. Přidejte další místa", 'info');
      return;
    }

    const dialogRef = this.dialog.open(PlaceDaySortComponent, {
      width: '100vw',
      height: '100%',
      panelClass: 'full-screen-dialog',
      disableClose: true,
      hasBackdrop: false,
      data: { places: this.dataService.places}
    });

    dialogRef.afterOpened().subscribe(() => {
      dialogRef.componentInstance.runAcoOptimization();
    });
  }
}
