import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { PlayerEngineService } from './playerEngine.service';
import { MusicServiceService } from '../services/music-service.service';
import { AudioService } from '../services/audio.service';
import { ThemeService } from '../services/theme.service';
import { Song, Albums, Album } from '../models/music.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  standalone: false,
})
export class PlayerComponent implements OnInit, OnDestroy {
  @ViewChild('rendererCanvas', { static: true })
  public rendererCanvas: ElementRef<HTMLCanvasElement>;

  @ViewChild('audio', { static: true })
  public audio: ElementRef<HTMLAudioElement>;

  canvas2d: HTMLCanvasElement;
  loading = true;
  currentSong: Song | null = null;
  currentAlbum: Album | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private playerEngine: PlayerEngineService,
    private musicService: MusicServiceService,
    private audioService: AudioService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.canvas2d = document.querySelector('#renderCanvas') as HTMLCanvasElement;
    this.setupSubscriptions();
    this.initializePlayer();
    this.setupMusicServiceSubscriptions();
  }

  private setupSubscriptions(): void {
    this.musicService.changedSong.pipe(takeUntil(this.destroy$)).subscribe((song: Song) => {
      this.playSong(song);
    });

    this.musicService.pausedSong.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.pauseAudio();
    });

    this.musicService.unpausedSong.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.unpauseAudio();
    });
  }

  private initializePlayer(): void {
    this.playerEngine.init(this.canvas2d);
    this.playerEngine.animate();
    this.setupAudioElement();
  }

  private setupAudioElement(): void {
    const audioElement = this.audio.nativeElement;
    audioElement.crossOrigin = 'anonymous';
    audioElement.volume = 0.1;

    audioElement.onended = () => {
      this.nextSong();
    };

    this.playerEngine.setupAudioContext(audioElement);
  }

  async playSong(song: Song): Promise<void> {
    try {
      this.loading = true;
      this.playerEngine.stopPlaying();

      this.loadSong(song);

      this.audioService.setupAudioElement(this.audio.nativeElement, song);
      this.audio.nativeElement.load();

      await this.audioService.resumeAudioContext();
      await this.audio.nativeElement.play();

      // Start the visualization engine to begin audio analysis
      this.playerEngine.startPlaying();

      this.loading = false;
    } catch (error) {
      this.loading = false;
      this.handlePlaybackFallback(song);
    }
  }

  private async handlePlaybackFallback(song: Song): Promise<void> {
    try {
      this.audioService.setupAudioElement(this.audio.nativeElement, song);
      await this.audio.nativeElement.play();
      this.playerEngine.startPlaying();
    } catch (fallbackError) {}
  }

  pauseAudio(): void {
    this.playerEngine.stopPlaying();
    this.audio.nativeElement.pause();
  }

  async unpauseAudio(): Promise<void> {
    try {
      await this.audioService.resumeAudioContext();
      await this.audio.nativeElement.play();
      this.playerEngine.startPlaying();
    } catch (error) {}
  }

  nextSong(): void {
    this.musicService.songEnd();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private findAlbumBySong(song: Song): Album | null {
    const albums = this.musicService.getAlbums();
    for (const albumKey in albums) {
      if (albums.hasOwnProperty(albumKey)) {
        const album = albums[albumKey];
        if (album.songs.some((albumSong) => albumSong.path === song.path)) {
          return album;
        }
      }
    }
    return null;
  }

  private loadSong(song: Song): void {
    this.currentSong = song;
    this.currentAlbum = this.findAlbumBySong(song);

    if (this.currentAlbum && this.themeService.getCurrentTheme() === 'color') {
      this.themeService.setAlbumColors(this.currentAlbum);
    }
  }

  private setupMusicServiceSubscriptions(): void {
    this.themeService.currentTheme$.pipe(takeUntil(this.destroy$)).subscribe((theme) => {
      if (theme === 'color' && this.currentAlbum) {
        this.themeService.setAlbumColors(this.currentAlbum);
      }
    });
  }
}
