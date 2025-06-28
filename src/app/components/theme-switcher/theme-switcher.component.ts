import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeService, ThemeMode } from '../../services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.scss'],
  standalone: false,
})
export class ThemeSwitcherComponent implements OnInit, OnDestroy {
  currentTheme: ThemeMode = 'dark';
  isOpen = false;
  private destroy$ = new Subject<void>();

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.currentTheme$.pipe(takeUntil(this.destroy$)).subscribe((theme: ThemeMode) => {
      this.currentTheme = theme;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectTheme(theme: ThemeMode): void {
    this.themeService.setTheme(theme);
    this.isOpen = false;
  }

  getThemeLabel(theme: ThemeMode): string {
    switch (theme) {
      case 'dark':
        return 'Dark';
      case 'light':
        return 'Light';
      case 'color':
        return 'Colorful';
      default:
        return 'Dark';
    }
  }

  getThemeIcon(theme: ThemeMode): string {
    switch (theme) {
      case 'dark':
        return '🌙';
      case 'light':
        return '☀️';
      case 'color':
        return '🎨';
      default:
        return '🌙';
    }
  }
}
