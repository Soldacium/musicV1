import { Component, OnInit, AfterViewInit } from '@angular/core';
import { MusicServiceService } from '../../services/music-service.service';
@Component({
  selector: 'app-player-playlist',
  templateUrl: './player-playlist.component.html',
  styleUrls: ['./player-playlist.component.scss'],
})
export class PlayerPlaylistComponent implements OnInit, AfterViewInit {
  songs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  currentSong = 2;

  albums;
  albumsArray = [];
  currentAlbum;
  playing = false;
  constructor(private music: MusicServiceService) {}

  public ngOnInit(): void {
    this.albums = this.music.getAlbums();
    Object.values(this.albums).forEach((album) => {
      this.albumsArray.push(album);
    });

    this.setSubscriptions();
    console.log(this.albumsArray);
    this.changeAlbum('whereAreMyFriends');
    this.initFlow();
  }

  setSubscriptions() {
    this.music.nextSong.subscribe(() => {
      console.log('event recived');
      const songNum = this.currentAlbum.songs.indexOf(this.currentSong);
      console.log(songNum, this.currentAlbum.songs.length, this.currentAlbum.songs[songNum + 1]);
      if (songNum < this.currentAlbum.songs.length - 1) {
        this.changeSong(this.currentAlbum.songs[songNum + 1]);
      } else {
        this.changeSong(this.currentAlbum.songs[0]);
      }
    });

    this.music.settings.subscribe(() => {
      console.log('hey');
      //this.changeAlbum(album);
      //this.changeSong(song)
    });

    this.music.changedSong.subscribe((song) => {
      console.log(song);
      //this.play(song);
    });
  }

  ngAfterViewInit(): void {
    this.initFlow();
  }
  changeSong(song) {
    this.currentSong = song;
    this.music.changeSong(this.currentSong);
    this.playing = true;
  }

  pauseSong() {
    this.music.pauseSong();
    this.playing = false;
  }

  unpauseSong() {
    this.music.unpauseSong();
    this.playing = true;
  }

  changeAlbum(album) {
    this.currentAlbum = this.albums[album];
    console.log(this.currentAlbum);
  }

  /**
   * COVERFLOW EFFECT
   */

  // Local variables
  _index = 0;
  _coverflow = null;
  _prevLink = null;
  _nextLink = null;
  _albums = [];
  _transformName = 'transform';

  // Constants
  OFFSET = 70; // pixels
  ROTATION = 45; // degrees
  BASE_ZINDEX = 10; //
  MAX_ZINDEX = 42; //

  /**
   * Get selector from the dom
   **/

  clickAlbum(albumIndex: number) {
    this._index = albumIndex;
    this.render();

    this.currentAlbum = this.albumsArray[albumIndex];
  }
  get(selector) {
    return document.querySelector(selector);
  }

  /**
   * Renders the CoverFlow based on the current _index
   **/
  render() {
    // loop through albums & transform positions
    for (let i = 0; i < this._albums.length; i++) {
      // before
      if (i < this._index) {
        this._albums[i].style[this._transformName] =
          'translateX( -' +
          this.OFFSET * (this._index - i) +
          '% ) rotateY( ' +
          this.ROTATION +
          'deg )';
        this._albums[i].style.zIndex = this.BASE_ZINDEX + i;
      }

      // current
      if (i === this._index) {
        this._albums[i].style[this._transformName] = 'rotateY( 0deg ) translateZ( 140px )';
        this._albums[i].style.zIndex = this.MAX_ZINDEX;
      }

      // after
      if (i > this._index) {
        this._albums[i].style[this._transformName] =
          'translateX( ' +
          this.OFFSET * (i - this._index) +
          '% ) rotateY( -' +
          this.ROTATION +
          'deg )';
        this._albums[i].style.zIndex = this.BASE_ZINDEX + (this._albums.length - i);
      }
    }
  }

  /**
   * Flow to the right
   **/
  flowRight() {
    // check if has albums
    // on the right side

    if (this._albums.length > this._index + 1) {
      this._index++;
      this.render();
    }
    this.currentAlbum = this.albumsArray[this._index];
  }

  /**
   * Flow to the left
   **/
  flowLeft() {
    // check if has albums
    // on the left side
    if (this._index) {
      this._index--;
      this.render();
    }
    this.currentAlbum = this.albumsArray[this._index];
  }

  /**
   * Enable left & right keyboard events
   **/
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

  /**
   * Register all events
   **/
  registerEvents() {
    document.addEventListener('keydown', this.keyDown, false);
  }

  /**
   * Initalize
   **/
  initFlow() {
    // get albums & set index on the album in the middle
    this._albums = Array.prototype.slice.call(document.getElementsByClassName('album-pic'));

    this._index = Math.floor(this._albums.length / 2);

    console.log(this._index, this._albums, document.getElementsByClassName('album-pic')[0]);

    // do important stuff
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
