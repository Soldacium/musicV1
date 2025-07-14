import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { WelcomeEngineService } from './welcomeEngine.service';
import { Router } from '@angular/router';
import { MusicServiceService } from '../services/music-service.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: false,
})
export class WelcomeComponent implements OnInit, OnDestroy {
  @ViewChild('triangles', { static: true })
  public rendererCanvas: ElementRef<HTMLCanvasElement>;
  exploring = true;
  mode = 1;

  // Event listeners for cleanup
  private scrollListener: (() => void) | null = null;
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    private engine: WelcomeEngineService,
    private router: Router,
    private music: MusicServiceService
  ) {}

  ngOnInit(): void {
    this.engine.initializeEngine(this.rendererCanvas);
    this.addEventListeners();
    this.startWelcomeAnimation();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    // Remove event listeners
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }

    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
  }

  addEventListeners() {
    this.scrollListener = () => {
      if (window.pageYOffset > 0) {
        this.exploring = false;
      } else {
        this.exploring = true;
      }
    };
    window.addEventListener('scroll', this.scrollListener);

    this.keydownListener = (event) => {
      if (event.keyCode === 32) {
        this.playRandom();
      }
    };
    window.addEventListener('keydown', this.keydownListener);
  }

  async startWelcomeAnimation() {
    // Start with enter animation
    await this.engine.animateEnterAsync();

    // Once enter animation is complete, switch to continuous triangle animation
    this.mode = 1;
    this.engine.startTriangleAnimation();
  }

  async playRandom() {
    // Start exit animation
    this.settings();
    this.mode = 2;
    this.engine.animateExitAsync().then(() => {
      this.router.navigate(['/player']);
    });

    // Once exit animation is complete, navigate to player
  }

  settings() {
    const random = Math.floor(Math.random() * 6);
    this.music.setSettings('whereAreMyFriends', random);
    this.music.changeSong(this.music.albums.whereAreMyFriends.songs[random]);
    this.music.currentSong = random;
    this.music.currentAlbum = 'whereAreMyFriends';
  }
}
