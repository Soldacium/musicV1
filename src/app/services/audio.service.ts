import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Song } from '../models/music.interface';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioContext: AudioContext;
  private corsProxyUrl = 'https://api.allorigins.win/raw?url=';

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Load audio file with CORS proxy support
   */
  loadAudioWithCORS(url: string): Observable<ArrayBuffer> {
    return from(this.fetchWithCORS(url));
  }

  /**
   * Fetch audio data using CORS proxy
   */
  private async fetchWithCORS(url: string): Promise<ArrayBuffer> {
    try {
      // First try direct fetch (for local files or CORS-enabled servers)
      const directResponse = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (directResponse.ok) {
        return await directResponse.arrayBuffer();
      }
    } catch (error) {
      console.log('Direct fetch failed, trying with CORS proxy...');
    }

    // If direct fetch fails, use CORS proxy
    try {
      const proxyUrl = this.corsProxyUrl + encodeURIComponent(url);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Failed to load audio with CORS proxy:', error);
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
      const arrayBuffer = await this.fetchWithCORS(song.path);
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
   * Set up audio element with CORS
   */
  setupAudioElement(audioElement: HTMLAudioElement, song: Song): void {
    audioElement.crossOrigin = 'anonymous';
    audioElement.src = song.path;

    // Handle CORS errors by falling back to proxy
    audioElement.addEventListener('error', (event) => {
      console.warn('Audio element failed to load, trying with proxy...');
      audioElement.src = this.corsProxyUrl + encodeURIComponent(song.path);
    });
  }
}
