import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-player-menu',
    templateUrl: './player-menu.component.html',
    styleUrls: ['./player-menu.component.scss'],
    standalone: false
})
export class PlayerMenuComponent implements OnInit {
  more = false;

  constructor() {}

  ngOnInit() {
    window.addEventListener('mousemove', (event) => {
      this.mouseMove(event);
    });

    const musicMenu = document.getElementById('menu');
    if (musicMenu) {
      musicMenu.addEventListener('mouseleave', () => {
        this.more = false;
      });
    }
  }

  mouseMove(event: MouseEvent): void {
    if (event.x < 120) {
      this.more = true;
    }
  }
}
