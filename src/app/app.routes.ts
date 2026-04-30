import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users.routes').then((m) => m.usersRoutes),
      },
      { path: '', redirectTo: 'users', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
