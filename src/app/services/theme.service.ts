import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Album } from '../models/music.interface';

export type ThemeMode = 'dark' | 'light' | 'color';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  accent: string;
  wireframe: string;
  particleColors: string[];
  triangleColors: number[][]; // HSL format for Three.js
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<ThemeMode>('dark');
  private currentColorsSubject = new BehaviorSubject<ThemeColors>(this.getDarkTheme());

  public currentTheme$ = this.currentThemeSubject.asObservable();
  public currentColors$ = this.currentColorsSubject.asObservable();

  constructor() {
    this.loadSavedTheme();
    this.applyThemeToDocument();
  }

  private loadSavedTheme(): void {
    const savedTheme = localStorage.getItem('music-app-theme') as ThemeMode;
    if (savedTheme && ['dark', 'light', 'color'].includes(savedTheme)) {
      this.currentThemeSubject.next(savedTheme);
      this.updateColors();
    }
  }

  private saveTheme(theme: ThemeMode): void {
    localStorage.setItem('music-app-theme', theme);
  }

  setTheme(theme: ThemeMode): void {
    this.currentThemeSubject.next(theme);
    this.saveTheme(theme);
    this.updateColors();
    this.applyThemeToDocument();
  }

  getCurrentTheme(): ThemeMode {
    return this.currentThemeSubject.value;
  }

  getCurrentColors(): ThemeColors {
    return this.currentColorsSubject.value;
  }

  setAlbumColors(album: Album): void {
    if (this.getCurrentTheme() === 'color') {
      this.extractColorsFromImage(album.albumCover).then((colors) => {
        const colorTheme = this.getColorTheme(colors);
        this.currentColorsSubject.next(colorTheme);
        this.applyThemeToDocument();
      });
    }
  }

  private updateColors(): void {
    const theme = this.getCurrentTheme();
    let colors: ThemeColors;

    switch (theme) {
      case 'light':
        colors = this.getLightTheme();
        break;
      case 'dark':
        colors = this.getDarkTheme();
        break;
      case 'color':
        colors = this.getCurrentColors(); // Keep current colors for color mode
        break;
      default:
        colors = this.getDarkTheme();
    }

    this.currentColorsSubject.next(colors);
  }

  private getDarkTheme(): ThemeColors {
    return {
      primary: '#ffffff',
      secondary: '#cccccc',
      background: '#000000',
      foreground: '#ffffff',
      accent: '#666666',
      wireframe: 'rgb(212,212,212)',
      particleColors: ['#ffffff', '#cccccc', '#999999'],
      triangleColors: [
        [0, 0, 0], // black
        [0, 0, 0.2], // dark gray
        [0, 0, 0.4], // medium gray
      ],
    };
  }

  private getLightTheme(): ThemeColors {
    return {
      primary: '#000000',
      secondary: '#333333',
      background: '#ffffff',
      foreground: '#000000',
      accent: '#999999',
      wireframe: 'rgb(43,43,43)',
      particleColors: ['#000000', '#333333', '#666666'],
      triangleColors: [
        [0, 0, 1], // white
        [0, 0, 0.8], // light gray
        [0, 0, 0.6], // darker gray
      ],
    };
  }

  private getColorTheme(dominantColors: string[]): ThemeColors {
    const hslColors = dominantColors.map((color) => this.hexToHsl(color));

    return {
      primary: dominantColors[0] || '#ffffff',
      secondary: dominantColors[1] || '#cccccc',
      background: '#ffffff',
      foreground: '#000000',
      accent: dominantColors[2] || '#666666',
      wireframe: dominantColors[0] || 'rgb(212,212,212)',
      particleColors: dominantColors.slice(0, 3),
      triangleColors: [
        [0, 0, 1], // white
        [0, 0, 0.8], // light gray
        [0, 0, 0.6], // darker gray
      ],
    };
  }

  private async extractColorsFromImage(imageSrc: string): Promise<string[]> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(['#8B5CF6', '#06B6D4', '#10B981']);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = this.analyzeImageColors(imageData);

        resolve(colors);
      };

      img.onerror = () => {
        // Fallback colors if image loading fails
        resolve(['#8B5CF6', '#06B6D4', '#10B981']);
      };

      img.src = imageSrc;
    });
  }

  private analyzeImageColors(imageData: ImageData): string[] {
    const data = imageData.data;
    const colorCounts: { [key: string]: number } = {};

    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      // RGBA = 4 bytes per pixel, so 40 = every 10th pixel
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip transparent or very dark/light pixels
      if (a < 128 || r + g + b < 50 || r + g + b > 700) {
        continue;
      }

      // Quantize colors to reduce noise
      const quantizedR = Math.floor(r / 32) * 32;
      const quantizedG = Math.floor(g / 32) * 32;
      const quantizedB = Math.floor(b / 32) * 32;

      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
      colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
    }

    // Get the most common colors
    const sortedColors = Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([color]) => {
        const [r, g, b] = color.split(',').map(Number);
        return this.rgbToHex(r, g, b);
      });

    return sortedColors.length >= 3 ? sortedColors : ['#8B5CF6', '#06B6D4', '#10B981'];
  }

  private rgbToHex(r: number, g: number, b: number): string {
    // tslint:disable-next-line:no-bitwise
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s: number;
    const l = (max + min) / 2;

    if (max === min) {
      h = 0;
      s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
        default:
          h = 0;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private applyThemeToDocument(): void {
    const colors = this.getCurrentColors();
    const root = document.documentElement;

    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-background', colors.background);
    root.style.setProperty('--theme-foreground', colors.foreground);
    root.style.setProperty('--theme-accent', colors.accent);
    root.style.setProperty('--theme-wireframe', colors.wireframe);

    // Set theme class on body
    const theme = this.getCurrentTheme();
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme}`);
  }
}
