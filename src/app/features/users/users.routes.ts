import { Routes } from '@angular/router';
import { UsersListComponent } from './users-list/users-list.component';
import { UserFormComponent } from './user-form/user-form.component';

export const usersRoutes: Routes = [
  { path: '', component: UsersListComponent },
  { path: 'new', component: UserFormComponent },
  { path: ':id/edit', component: UserFormComponent },
];
