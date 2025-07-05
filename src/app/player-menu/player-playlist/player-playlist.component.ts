import { Component, OnInit, AfterViewInit } from '@angular/core';
import { MusicServiceService } from '../../services/music-service.service';
import { Album, Albums, Song } from '../../models/music.interface';

@Component({
  selector: 'app-player-playlist',
  templateUrl: './player-playlist.component.html',
  styleUrls: ['./player-playlist.component.scss'],
  standalone: false,
})
export class PlayerPlaylistComponent implements OnInit, AfterViewInit {
  constructor(private music: MusicServiceService) {}

  songs: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  currentSong: Song | null = null;

  albums: Albums;
  albumsArray: Album[] = [];
  currentAlbum: Album;
  playing = false;

  // Local variables
  albumIndex = 0;
  albumsHtml: HTMLElement[] = [];
  transformName = 'transform';

  // Constants
  OFFSET = 70; // pixels
  ROTATION = 45; // degrees
  BASE_ZINDEX = 10; //
  MAX_ZINDEX = 42; //

  public ngOnInit(): void {
    this.albums = this.music.getAlbums();
    Object.values(this.albums).forEach((album) => {
      this.albumsArray.push(album);
    });

    this.setSubscriptions();
    this.changeAlbum('whereAreMyFriends');
    this.initFlow();
  }

  setSubscriptions(): void {
    this.music.nextSong.subscribe(() => {
      const songNum = this.currentAlbum.songs.indexOf(this.currentSong as Song);
      if (songNum < this.currentAlbum.songs.length - 1) {
        this.changeSong(this.currentAlbum.songs[songNum + 1]);
      } else {
        this.changeSong(this.currentAlbum.songs[0]);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initFlow();
  }
  changeSong(song: Song): void {
    this.currentSong = song;
    this.music.changeSong(song);
    this.playing = true;
  }

  pauseSong(): void {
    this.music.pauseSong();
    this.playing = false;
  }

  unpauseSong(): void {
    this.music.unpauseSong();
    this.playing = true;
  }

  changeAlbum(album: string): void {
    this.currentAlbum = this.albums[album];
  }

  clickAlbum(albumIndex: number) {
    this.albumIndex = albumIndex;
    this.render();

    this.currentAlbum = this.albumsArray[albumIndex];
  }
  get(selector) {
    return document.querySelector(selector);
  }

  render(): void {
    // loop through albums & transform positions
    for (let i = 0; i < this.albumsHtml.length; i++) {
      // before
      if (i < this.albumIndex) {
        this.albumsHtml[i].style[this.transformName] =
          'translateX( -' +
          this.OFFSET * (this.albumIndex - i) +
          '% ) rotateY( ' +
          this.ROTATION +
          'deg )';
        this.albumsHtml[i].style.zIndex = String(this.BASE_ZINDEX + i);
      }

      // current
      if (i === this.albumIndex) {
        this.albumsHtml[i].style[this.transformName] = 'rotateY( 0deg ) translateZ( 140px )';
        this.albumsHtml[i].style.zIndex = String(this.MAX_ZINDEX);
      }

      // after
      if (i > this.albumIndex) {
        this.albumsHtml[i].style[this.transformName] =
          'translateX( ' +
          this.OFFSET * (i - this.albumIndex) +
          '% ) rotateY( -' +
          this.ROTATION +
          'deg )';
        this.albumsHtml[i].style.zIndex = String(this.BASE_ZINDEX + (this.albumsHtml.length - i));
      }
    }
  }

  flowRight(): void {
    if (this.albumsHtml.length > this.albumIndex + 1) {
      this.albumIndex++;
      this.render();
    }
    this.currentAlbum = this.albumsArray[this.albumIndex];
  }

  flowLeft() {
    if (this.albumIndex) {
      this.albumIndex--;
      this.render();
    }
    this.currentAlbum = this.albumsArray[this.albumIndex];
  }

  keyDown(event) {
    switch (event.keyCode) {
      case 37:
        this.flowRight();
        break; // left
      case 39:
        this.flowLeft();
        break; // right
    }
  }

  registerEvents() {
    document.addEventListener('keydown', this.keyDown, false);
  }

  initFlow() {
    this.albumsHtml = Array.prototype.slice.call(document.getElementsByClassName('album-pic'));
    this.albumIndex = Math.floor(this.albumsHtml.length / 2);

    this.registerEvents();
    this.render();
  }

  private getTransform(index: number, total: number): string {
    return (
      'translateX( -' + index * (360 / total) + '% ) rotateY( ' + index * (360 / total) + 'deg )'
    );
  }

  private getTransformCenter(): string {
    return 'rotateY( 0deg ) translateZ( 140px )';
  }

  private getTransformRight(index: number, total: number): string {
    return (
      'translateX( ' + index * (360 / total) + '% ) rotateY( -' + index * (360 / total) + 'deg )'
    );
  }
}
