import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
    imports: [MatIcon, MatButton, RouterLink, TranslatePipe]
})
export class HomeComponent implements OnInit {
  gridCols = 3;

  ngOnInit() {
    this.setCols();
    window.addEventListener('resize', () => this.setCols());
  }

  setCols() {
    this.gridCols = window.innerWidth <= 768 ? 1 : (window.innerWidth <= 1024 ? 2 : 3);
  }

}
