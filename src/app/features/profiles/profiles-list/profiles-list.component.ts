import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { ProfilesService } from '../services/profiles.service';
import { ProfileListItem } from '../models/profile.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-profiles-list',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslocoPipe],
  templateUrl: './profiles-list.component.html',
})
export class ProfilesListComponent implements OnInit {
  private readonly profilesService = inject(ProfilesService);
  private readonly toastService = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly search = signal('');
  readonly items = signal<ProfileListItem[]>([]);
  readonly page = signal(1);
  readonly perPage = 10;
  readonly total = signal(0);
  readonly lastPage = signal(1);

  readonly pageNumbers = computed(() => {
    const last = this.lastPage();
    const current = this.page();
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, current - half);
    let end = start + maxButtons - 1;
    if (end > last) {
      end = last;
      start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  constructor() {
    toObservable(this.search)
      .pipe(skip(1), debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.profilesService
      .getAll({ search: this.search(), page: this.page(), perPage: this.perPage })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.pagination.total);
          this.lastPage.set(res.pagination.lastPage);
          this.loading.set(false);
        },
        error: () => {
          this.toastService.error(this.t.translate('profiles.loadError'));
          this.loading.set(false);
        },
      });
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.lastPage()) return;
    this.page.set(p);
    this.load();
  }

  confirmDelete(item: ProfileListItem): void {
    if (!confirm(this.t.translate('profiles.deleteConfirm', { nickname: item.nickname }))) return;
    this.profilesService.remove(item.id).subscribe({
      next: () => {
        this.toastService.success(this.t.translate('profiles.deleteSuccess'));
        this.load();
      },
      error: () => this.toastService.error(this.t.translate('profiles.deleteError')),
    });
  }
}
