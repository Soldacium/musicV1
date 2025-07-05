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

  selectTheme(theme: ThemeMode): void {
    this.themeService.setTheme(theme);
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
    const isActive = this.currentTheme === theme;
    switch (theme) {
      case 'dark':
        return isActive ? 'fas fa-moon' : 'far fa-moon';
      case 'light':
        return isActive ? 'fas fa-sun' : 'far fa-sun';
      case 'color':
        return isActive ? 'fa-solid fa-palette' : 'fa-solid fa-palette';
      default:
        return isActive ? 'fas fa-moon' : 'far fa-moon';
    }
  }
}
