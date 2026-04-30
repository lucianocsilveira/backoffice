import { Routes } from '@angular/router';
import { GamesListComponent } from './games-list/games-list.component';
import { GameFormComponent } from './game-form/game-form.component';

export const gamesRoutes: Routes = [
  { path: '', component: GamesListComponent },
  { path: 'new', component: GameFormComponent },
  { path: ':id/edit', component: GameFormComponent },
];
