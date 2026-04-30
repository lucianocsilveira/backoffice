import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { GamesService } from '../services/games.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-game-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './game-form.component.html',
})
export class GameFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly gamesService = inject(GamesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly t = inject(TranslocoService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly itemId = signal<string | null>(null);
  readonly isEdit = signal(false);

  readonly form = this.fb.nonNullable.group({
    slug: ['', [Validators.required, Validators.minLength(2)]],
    imageUrl: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.itemId.set(id);
      this.isEdit.set(true);
      this.loadItem(id);
    }
  }

  private loadItem(id: string): void {
    this.loading.set(true);
    this.gamesService.getById(id).subscribe({
      next: (item) => {
        this.form.patchValue({ slug: item.slug, imageUrl: item.imageUrl });
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error(this.t.translate('gameForm.loadError'));
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const value = this.form.getRawValue();

    const obs$ = this.isEdit()
      ? this.gamesService.update(this.itemId()!, value)
      : this.gamesService.create(value);

    obs$.subscribe({
      next: () => {
        this.toastService.success(
          this.isEdit() ? this.t.translate('gameForm.updateSuccess') : this.t.translate('gameForm.createSuccess')
        );
        this.router.navigate(['/games']);
      },
      error: () => {
        this.toastService.error(this.t.translate('gameForm.saveError'));
        this.saving.set(false);
      },
    });
  }

  hasError(field: 'slug' | 'imageUrl'): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }
}
