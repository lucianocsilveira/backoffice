import { Routes } from '@angular/router';
import { ProfilesListComponent } from './profiles-list/profiles-list.component';
import { ProfileFormComponent } from './profile-form/profile-form.component';

export const profilesRoutes: Routes = [
  { path: '', component: ProfilesListComponent },
  { path: 'new', component: ProfileFormComponent },
  { path: ':id/edit', component: ProfileFormComponent },
];
