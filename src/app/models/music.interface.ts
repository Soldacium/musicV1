export interface Song {
  name: string;
  duration: string;
  path: string;
}

export interface Album {
  albumName: string;
  albumCover: string;
  albumArtist: string;
  songs: Song[];
}

export interface Albums {
  [key: string]: Album;
}

export interface BeatDetectionResult {
  bpm: number;
  offset: number;
  tempo: number;
}

export interface AudioSettings {
  album: string;
  song: number;
}

export interface MusicPlayerState {
  currentSong: number;
  currentAlbum: string;
  isPlaying: boolean;
  volume: number;
}

export interface VisualizationData {
  beatTime: number;
  beatColors: number[][];
  musicData: Uint8Array;
}
