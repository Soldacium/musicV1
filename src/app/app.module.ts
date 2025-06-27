import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PlayerComponent } from './player/player.component';
import { RouterModule } from '@angular/router';
import { TestsComponent } from './tests/tests.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { PlayerMenuComponent } from './player-menu/player-menu.component';
import { PlayerPlaylistComponent } from './player-menu/player-playlist/player-playlist.component';
import { MusicServiceService } from './services/music-service.service';

@NgModule({
  declarations: [
    AppComponent,
    PlayerComponent,
    TestsComponent,
    WelcomeComponent,
    PlayerMenuComponent,
    PlayerPlaylistComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule.forRoot([
    {
        component: PlayerComponent,
        path: 'player'
    },
    {
        path: 'tests',
        component: PlayerMenuComponent,
        children: [
            {
                path: '',
                redirectTo: 'playlist',
                pathMatch: 'full'
            },
            {
                path: 'playlist',
                component: PlayerPlaylistComponent
            }
        ]
    },
    {
        path: 'welcome',
        component: WelcomeComponent
    },
    {
        path: '**',
        component: WelcomeComponent
    }
], { relativeLinkResolution: 'legacy' })
  ],
  providers: [MusicServiceService],
  bootstrap: [AppComponent]
})
export class AppModule { }
