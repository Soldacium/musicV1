import { Injectable, Output, EventEmitter } from '@angular/core';
import { Song, Album, Albums, AudioSettings } from '../models/music.interface';
import { albums } from '../data/albums.data';

@Injectable({
  providedIn: 'root',
})
export class MusicServiceService {
  @Output() changedSong = new EventEmitter<Song>();
  @Output() pausedSong = new EventEmitter<void>();
  @Output() unpausedSong = new EventEmitter<void>();
  @Output() nextSong = new EventEmitter<void>();
  @Output() settings = new EventEmitter<AudioSettings>();

  currentSong = 0;
  currentAlbum = '';

  albums: Albums = albums;

  constructor() {}

  getAlbums(): Albums {
    return this.albums;
  }

  changeSong(song: Song): void {
    this.findAndSetCurrentAlbumSong(song);
    this.changedSong.emit(song);
  }

  setCurrentAlbumSong(albumKey: string, songIndex: number): void {
    this.currentAlbum = albumKey;
    this.currentSong = songIndex;

    const album = this.albums[albumKey as keyof Albums];
    if (album && album.songs[songIndex]) {
      this.changedSong.emit(album.songs[songIndex]);
    }
  }

  private findAndSetCurrentAlbumSong(song: Song): void {
    for (const albumKey in this.albums) {
      if (this.albums.hasOwnProperty(albumKey)) {
        const album = this.albums[albumKey as keyof Albums];
        const songIndex = album.songs.findIndex((s) => s.path === song.path);

        if (songIndex !== -1) {
          this.currentAlbum = albumKey;
          this.currentSong = songIndex;
          return;
        }
      }
    }
  }

  pauseSong(): void {
    this.pausedSong.emit();
  }

  unpauseSong(): void {
    this.unpausedSong.emit();
  }

  songEnd(): void {
    this.nextSong.emit();
  }

  setSettings(album: string, song: number): void {
    this.currentAlbum = album;
    this.currentSong = song;
    const settings: AudioSettings = { album, song };
    this.settings.emit(settings);
  }
}
