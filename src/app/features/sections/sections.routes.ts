import { Routes } from '@angular/router';
import { SectionsListComponent } from './sections-list/sections-list.component';
import { SectionFormComponent } from './section-form/section-form.component';

export const sectionsRoutes: Routes = [
  { path: '', component: SectionsListComponent },
  { path: 'new', component: SectionFormComponent },
  { path: ':id/edit', component: SectionFormComponent },
];
