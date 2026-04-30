import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UsersService } from '../services/users.service';
import { User } from '../models/user.model';
import { ToastService } from '../../../core/services/toast.service';
import { PagedResult } from '../../../core/models/api.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './users-list.component.html',
})
export class UsersListComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(false);
  readonly search = signal('');
  readonly page = signal(1);
  readonly pageSize = 10;

  readonly result = signal<PagedResult<User>>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: this.pageSize,
    totalPages: 0,
  });

  readonly totalPages = computed(() => this.result().totalPages);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.usersService
      .getAll({ page: this.page(), pageSize: this.pageSize, search: this.search() })
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.loading.set(false);
        },
        error: () => {
          this.toastService.error('Erro ao carregar usuários.');
          this.loading.set(false);
        },
      });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.load();
  }

  setPage(p: number): void {
    this.page.set(p);
    this.load();
  }

  confirmDelete(user: User): void {
    if (!confirm(`Excluir o usuário "${user.name}"?`)) return;
    this.usersService.remove(user.id).subscribe({
      next: () => {
        this.toastService.success('Usuário excluído com sucesso.');
        this.load();
      },
      error: () => this.toastService.error('Erro ao excluir usuário.'),
    });
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
}
