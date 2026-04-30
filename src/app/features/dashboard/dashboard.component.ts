import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly currentUser = inject(AuthService).currentUser;

  readonly stats = [
    { label: 'Usuários ativos', value: '—', icon: 'users', color: 'bg-blue-500' },
    { label: 'Novos hoje', value: '—', icon: 'plus', color: 'bg-green-500' },
    { label: 'Pendentes', value: '—', icon: 'clock', color: 'bg-yellow-500' },
    { label: 'Total geral', value: '—', icon: 'chart', color: 'bg-purple-500' },
  ];
}
