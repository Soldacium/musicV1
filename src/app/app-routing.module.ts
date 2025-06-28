import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlayerMenuComponent } from './player-menu/player-menu.component';
import { PlayerPlaylistComponent } from './player-menu/player-playlist/player-playlist.component';
import { WelcomeComponent } from './welcome/welcome.component';

const routes: Routes = [
  {
    path: 'player',
    component: PlayerMenuComponent,
    children: [
      {
        path: '',
        redirectTo: 'playlist',
        pathMatch: 'full',
      },
      {
        path: 'playlist',
        component: PlayerPlaylistComponent,
      },
    ],
  },
  {
    path: 'welcome',
    component: WelcomeComponent,
  },
  {
    path: '**',
    component: WelcomeComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
