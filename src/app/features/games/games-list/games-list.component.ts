import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { GamesService } from '../services/games.service';
import { GameItem } from '../models/game-item.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-games-list',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslocoPipe],
  templateUrl: './games-list.component.html',
})
export class GamesListComponent implements OnInit {
  private readonly gamesService = inject(GamesService);
  private readonly toastService = inject(ToastService);
  private readonly t = inject(TranslocoService);

  readonly loading = signal(false);
  readonly search = signal('');
  readonly items = signal<GameItem[]>([]);

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter((g) => g.slug.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.gamesService.getAll().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error(this.t.translate('games.loadError'));
        this.loading.set(false);
      },
    });
  }

  confirmDelete(item: GameItem): void {
    if (!confirm(this.t.translate('games.deleteConfirm', { slug: item.slug }))) return;
    this.gamesService.remove(item.id).subscribe({
      next: () => {
        this.toastService.success(this.t.translate('games.deleteSuccess'));
        this.load();
      },
      error: () => this.toastService.error(this.t.translate('games.deleteError')),
    });
  }
}
