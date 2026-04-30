import { Routes } from '@angular/router';
import { UsersListComponent } from './users-list/users-list.component';
import { UserFormComponent } from './user-form/user-form.component';
import { masterGuard } from '../../core/guards/role.guard';

export const usersRoutes: Routes = [
  { path: '', component: UsersListComponent },
  { path: 'new', component: UserFormComponent, canActivate: [masterGuard] },
  { path: ':id/edit', component: UserFormComponent, canActivate: [masterGuard] },
];
