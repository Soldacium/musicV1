import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';
import { PlayerMenuComponent } from './player-menu/player-menu.component';
import { PlayerPlaylistComponent } from './player-menu/player-playlist/player-playlist.component';
import { PlayerComponent } from './player/player.component';
import { ThemeSwitcherComponent } from './components/theme-switcher/theme-switcher.component';
import { MusicServiceService } from './services/music-service.service';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    PlayerMenuComponent,
    PlayerPlaylistComponent,
    PlayerComponent,
    ThemeSwitcherComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, CommonModule, AppRoutingModule],
  providers: [MusicServiceService],
  bootstrap: [AppComponent],
})
export class AppModule {}
