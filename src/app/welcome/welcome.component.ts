import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import Delaunator from 'delaunator';
import { WelcomeEngineService } from './welcomeEngine.service';
import { Router } from '@angular/router';
import { MusicServiceService } from '../services/music-service.service';
@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: false,
})
export class WelcomeComponent implements OnInit {
  @ViewChild('triangles', { static: true })
  public rendererCanvas: ElementRef<HTMLCanvasElement>;
  exploring = true;

  height = window.innerHeight;
  width = window.innerWidth;
  pointsNum = 400;
  points: number[][] = [];
  coords: number[][][] = [];
  mode = 1;

  constructor(
    private engine: WelcomeEngineService,
    private router: Router,
    private music: MusicServiceService
  ) {}

  ngOnInit(): void {
    for (let i = 0; i < this.pointsNum; i++) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      this.points.push([x, y]);
    }
    const delaunay = Delaunator.from(this.points);
    const triangles = delaunay.triangles;

    for (let i = 0; i < triangles.length; i += 3) {
      this.coords.push([
        this.points[triangles[i]],
        this.points[triangles[i + 1]],
        this.points[triangles[i + 2]],
      ]);
    }
    this.initEngine();
    this.addEventListeners();
    this.enterAnimation();
  }

  initEngine() {
    this.engine.createScene(this.rendererCanvas);
    this.engine.createTriangles(this.coords);
    this.engine.animate();
  }

  addEventListeners() {
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 0) {
        this.exploring = false;
      } else {
        this.exploring = true;
      }
    });

    window.addEventListener('keydown', (event) => {
      if (event.keyCode === 32) {
        this.playRandom();
      }
    });
  }

  enterAnimation() {
    this.mode = 0;
    this.engine.mode = this.mode;
    this.engine.enterAcceleration = 5;

    setTimeout(() => {
      if (this.mode !== 2) {
        this.mode = 1;
        this.engine.mode = this.mode;
      }
    }, 6600);
  }

  playRandom() {
    this.mode = 2;
    this.engine.mode = this.mode;
    this.engine.exitAcceleration = 1;
    this.settings();

    setTimeout(() => {
      this.router.navigate(['/player']);
    }, 6400);
  }

  settings() {
    const random = Math.floor(Math.random() * 6);
    this.music.setSettings('whereAreMyFriends', random);
    this.music.changeSong(this.music.albums.whereAreMyFriends.songs[random]);
    this.music.currentSong = random;
    this.music.currentAlbum = 'whereAreMyFriends';
  }
}
