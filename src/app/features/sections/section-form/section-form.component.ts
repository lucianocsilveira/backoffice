import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { SectionsService } from '../services/sections.service';
import { GamesService } from '../../games/services/games.service';
import { GameItem } from '../../games/models/game-item.model';
import { SectionSelectedItem } from '../models/section.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-section-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink, TranslocoPipe],
  templateUrl: './section-form.component.html',
})
export class SectionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sectionsService = inject(SectionsService);
  private readonly gamesService = inject(GamesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly t = inject(TranslocoService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly itemId = signal<string | null>(null);
  readonly isEdit = signal(false);

  // ── All games (loaded once, client-side pagination) ──────────────────────
  readonly allGames = signal<GameItem[]>([]);
  readonly gamesLoading = signal(false);
  readonly gamesSearch = signal('');
  readonly gamesPage = signal(1);
  readonly gamesPerPage = 10;

  readonly filteredGames = computed(() => {
    const q = this.gamesSearch().toLowerCase().trim();
    return !q ? this.allGames() : this.allGames().filter((g) => g.slug.toLowerCase().includes(q));
  });

  readonly gamesTotal = computed(() => this.filteredGames().length);
  readonly gamesLastPage = computed(() =>
    Math.max(1, Math.ceil(this.gamesTotal() / this.gamesPerPage)),
  );
  readonly pagedGames = computed(() => {
    const start = (this.gamesPage() - 1) * this.gamesPerPage;
    return this.filteredGames().slice(start, start + this.gamesPerPage);
  });
  readonly gamesPageNumbers = computed(() => {
    const last = this.gamesLastPage();
    const current = this.gamesPage();
    const half = 2;
    let start = Math.max(1, current - half);
    let end = Math.min(last, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  // ── Selected items (ordered by priority) ─────────────────────────────────
  readonly selectedItems = signal<SectionSelectedItem[]>([]);
  private originalItemsJson = '';

  // ── Drag & drop state ─────────────────────────────────────────────────────
  readonly dragFromIndex = signal<number | null>(null);
  readonly dragOverIndex = signal<number | null>(null);

  // O(1) lookup: is a game already selected?
  readonly selectedGameIds = computed(() => new Set(this.selectedItems().map((s) => s.gameItemId)));

  // ── Form ──────────────────────────────────────────────────────────────────
  readonly form = this.fb.nonNullable.group({
    icon: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(2)]],
    message: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.itemId.set(id);
      this.isEdit.set(true);
      this.loadEditData(id);
    } else {
      this.loadAllGames();
    }
  }

  private loadEditData(id: string): void {
    this.loading.set(true);
    forkJoin({
      section: this.sectionsService.getById(id),
      games: this.gamesService.getAll({ perPage: 9999 }),
    }).subscribe({
      next: ({ section, games }) => {
        this.form.patchValue({ icon: section.icon, title: section.title, message: section.message });
        this.allGames.set(games.items);

        const slugToId = new Map(games.items.map((g) => [g.slug, g.id]));
        const selected: SectionSelectedItem[] = section.content
          .slice()
          .sort((a, b) => a.priority - b.priority)
          .map((c) => ({
            gameItemId: slugToId.get(c.slug) ?? '',
            slug: c.slug,
            gameImageUrl: c.gameImageUrl,
            priority: c.priority,
          }));

        this.selectedItems.set(selected);
        this.originalItemsJson = JSON.stringify(
          selected.map((s) => ({ slug: s.slug, priority: s.priority })),
        );
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error(this.t.translate('sectionForm.loadError'));
        this.loading.set(false);
      },
    });
  }

  private loadAllGames(): void {
    this.gamesLoading.set(true);
    this.gamesService.getAll({ perPage: 9999 }).subscribe({
      next: (res) => {
        this.allGames.set(res.items);
        this.gamesLoading.set(false);
      },
      error: () => {
        this.toastService.error(this.t.translate('sectionForm.gamesLoadError'));
        this.gamesLoading.set(false);
      },
    });
  }

  onGamesSearchChange(value: string): void {
    this.gamesSearch.set(value);
    this.gamesPage.set(1);
  }

  goToGamesPage(p: number): void {
    if (p < 1 || p > this.gamesLastPage()) return;
    this.gamesPage.set(p);
  }

  toggleGame(game: GameItem): void {
    const current = this.selectedItems();
    const idx = current.findIndex((s) => s.gameItemId === game.id);
    if (idx >= 0) {
      this.selectedItems.set(
        current.filter((_, i) => i !== idx).map((s, i) => ({ ...s, priority: i + 1 })),
      );
    } else {
      this.selectedItems.set([
        ...current,
        {
          gameItemId: game.id,
          slug: game.slug,
          gameImageUrl: game.imageUrl,
          priority: current.length + 1,
        },
      ]);
    }
  }

  removeSelectedItem(index: number): void {
    this.selectedItems.set(
      this.selectedItems()
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, priority: i + 1 })),
    );
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  onDragStart(index: number): void {
    this.dragFromIndex.set(index);
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dragOverIndex.set(index);
  }

  onDragLeave(): void {
    this.dragOverIndex.set(null);
  }

  onDrop(index: number): void {
    const from = this.dragFromIndex();
    if (from === null || from === index) {
      this.dragFromIndex.set(null);
      this.dragOverIndex.set(null);
      return;
    }
    const items = [...this.selectedItems()];
    const [moved] = items.splice(from, 1);
    items.splice(index, 0, moved);
    this.selectedItems.set(items.map((s, i) => ({ ...s, priority: i + 1 })));
    this.dragFromIndex.set(null);
    this.dragOverIndex.set(null);
  }

  onDragEnd(): void {
    this.dragFromIndex.set(null);
    this.dragOverIndex.set(null);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { icon, title, message } = this.form.getRawValue();
    const currentItems = this.selectedItems();
    const id = this.itemId();

    let items;
    if (!id) {
      // Create: always send items
      items = currentItems.map((s, i) => ({ gameItemId: s.gameItemId, priority: i + 1 }));
    } else {
      // Update: only send if changed
      const currentJson = JSON.stringify(
        currentItems.map((s) => ({ slug: s.slug, priority: s.priority })),
      );
      items =
        currentJson !== this.originalItemsJson
          ? currentItems.map((s, i) => ({ gameItemId: s.gameItemId, priority: i + 1 }))
          : null;
    }

    this.saving.set(true);
    const obs = id
      ? this.sectionsService.update(id, { icon, title, message, items })
      : this.sectionsService.create({ icon, title, message, items: items! });

    obs.subscribe({
      next: () => {
        this.toastService.success(
          this.t.translate(id ? 'sectionForm.updateSuccess' : 'sectionForm.createSuccess'),
        );
        this.router.navigate(['/sections']);
      },
      error: () => {
        this.toastService.error(this.t.translate('sectionForm.saveError'));
        this.saving.set(false);
      },
    });
  }
}
