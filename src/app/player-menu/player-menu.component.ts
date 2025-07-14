import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { MusicServiceService } from '../services/music-service.service';
import { AudioService } from '../services/audio.service';
import { ThemeService, ThemeColors } from '../services/theme.service';
import { Song, Album } from '../models/music.interface';

@Component({
  selector: 'app-player-menu',
  templateUrl: './player-menu.component.html',
  styleUrls: ['./player-menu.component.scss'],
  standalone: false,
})
export class PlayerMenuComponent implements OnInit, OnDestroy {
  more = false;
  showControls = true;

  isPlaying = false;
  isMuted = false;
  currentTime = 0;
  duration = 0;
  volume = 1;
  progressPercentage = 0;
  volumePercentage = 100;

  currentSongName = '';
  currentArtistName = '';
  currentAlbumCover = '';

  canGoPrevious = false;
  canGoNext = false;

  @ViewChild('audio', { static: false }) audioElement: ElementRef<HTMLAudioElement>;

  currentColors: ThemeColors;

  constructor(
    private musicService: MusicServiceService,
    private audioService: AudioService,
    private themeService: ThemeService
  ) {
    this.currentColors = this.themeService.getCurrentColors();
  }

  ngOnInit() {
    this.setupEventListeners();
    this.setupAudioElement();
    this.updateSongInfo();
    this.subscribeToThemeChanges();
    this.subscribeToMusicService();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private setupEventListeners() {
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

  private setupAudioElement() {
    const audio = document.getElementById('audio') as HTMLAudioElement;
    if (audio) {
      this.setupAudioEventListeners(audio);
    }
  }

  private setupAudioEventListeners(audio: HTMLAudioElement) {
    audio.addEventListener('timeupdate', () => {
      this.currentTime = audio.currentTime;
      this.duration = audio.duration || 0;
      this.progressPercentage = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    });

    audio.addEventListener('play', () => {
      this.isPlaying = true;
    });

    audio.addEventListener('pause', () => {
      this.isPlaying = false;
    });

    audio.addEventListener('ended', () => {
      this.nextSong();
    });

    audio.addEventListener('volumechange', () => {
      this.volume = audio.volume;
      this.volumePercentage = this.volume * 100;
      this.isMuted = audio.muted;
    });

    audio.volume = this.volume;
  }

  private subscribeToThemeChanges() {
    this.themeService.currentColors$.subscribe((colors) => {
      this.currentColors = colors;
    });
  }

  private subscribeToMusicService() {
    this.musicService.changedSong.subscribe(() => {
      this.updateSongInfo();
    });
  }

  private updateSongInfo() {
    const albums = this.musicService.getAlbums();
    const currentAlbum = albums[this.musicService.currentAlbum as keyof typeof albums] as Album;

    if (currentAlbum && currentAlbum.songs[this.musicService.currentSong]) {
      const song = currentAlbum.songs[this.musicService.currentSong];
      this.currentSongName = song.name;
      this.currentArtistName = currentAlbum.albumArtist;
      this.currentAlbumCover = currentAlbum.albumCover;

      this.canGoPrevious = this.musicService.currentSong > 0;
      this.canGoNext = this.musicService.currentSong < currentAlbum.songs.length - 1;
    }
  }

  private cleanup() {
    // Remove event listeners if needed
  }

  mouseMove(event: MouseEvent): void {
    if (event.x < 120) {
      this.more = true;
    }
  }

  togglePlayPause() {
    const audio = document.getElementById('audio') as HTMLAudioElement;
    if (audio) {
      if (this.isPlaying) {
        audio.pause();
        this.musicService.pauseSong();
      } else {
        audio.play();
        this.musicService.unpauseSong();
      }
    }
  }

  previousSong() {
    if (this.canGoPrevious) {
      const albums = this.musicService.getAlbums();
      const currentAlbum = albums[this.musicService.currentAlbum as keyof typeof albums] as Album;
      const newSongIndex = this.musicService.currentSong - 1;

      this.musicService.setCurrentAlbumSong(this.musicService.currentAlbum, newSongIndex);
    }
  }

  nextSong() {
    if (this.canGoNext) {
      const albums = this.musicService.getAlbums();
      const currentAlbum = albums[this.musicService.currentAlbum as keyof typeof albums] as Album;
      const newSongIndex = this.musicService.currentSong + 1;

      this.musicService.setCurrentAlbumSong(this.musicService.currentAlbum, newSongIndex);
    }
  }

  seekTo(event: MouseEvent) {
    const audio = document.getElementById('audio') as HTMLAudioElement;
    if (audio && audio.duration) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * audio.duration;

      audio.currentTime = newTime;
    }
  }

  toggleMute() {
    const audio = document.getElementById('audio') as HTMLAudioElement;
    if (audio) {
      audio.muted = !audio.muted;
      this.isMuted = audio.muted;
    }
  }

  setVolume(event: MouseEvent) {
    const audio = document.getElementById('audio') as HTMLAudioElement;
    if (audio) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));

      audio.volume = percentage;
      this.volume = percentage;
      this.volumePercentage = percentage * 100;
      this.isMuted = false;
    }
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds === 0) {
      return '0:00';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
