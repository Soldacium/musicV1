import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Song } from '../models/music.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Load audio file
   */
  loadAudio(url: string): Observable<ArrayBuffer> {
    return from(this.fetchAudio(url));
  }

  /**
   * Fetch audio data
   */
  private async fetchAudio(url: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw new Error(`Failed to load audio from ${url}: ${error.message}`);
    }
  }

  /**
   * Decode audio data to AudioBuffer
   */
  decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    return this.audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Load and decode audio file in one step
   */
  async loadAndDecodeAudio(song: Song): Promise<AudioBuffer> {
    try {
      const arrayBuffer = await this.fetchAudio(song.path);
      return await this.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error(`Failed to load and decode audio for song "${song.name}":`, error);
      throw error;
    }
  }

  /**
   * Get the audio context instance
   */
  getAudioContext(): AudioContext {
    return this.audioContext;
  }

  /**
   * Resume audio context if suspended
   */
  async resumeAudioContext(): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Set up audio element
   */
  setupAudioElement(audioElement: HTMLAudioElement, song: Song): void {
    audioElement.crossOrigin = 'anonymous';
    audioElement.src = song.path;
  }
}
