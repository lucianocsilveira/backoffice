import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { GamesService } from '../services/games.service';
import { ToastService } from '../../../core/services/toast.service';
import { isFileSizeValid, isFileTypeValid } from '../../../shared/utils/file-validation.utils';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';

@Component({
  selector: 'app-game-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe, TooltipDirective],
  templateUrl: './game-form.component.html',
})
export class GameFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly gamesService = inject(GamesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly t = inject(TranslocoService);

  private objectUrl: string | null = null;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly itemId = signal<string | null>(null);
  readonly isEdit = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly existingImageUrl = signal<string | null>(null);
  readonly imageRequired = signal(false);
  readonly imageSizeError = signal(false);
  readonly imageTypeError = signal(false);
  readonly imageLoadError = signal(false);
  readonly previewLoadError = signal(false);
  readonly isDragOver = signal(false);

  readonly form = this.fb.nonNullable.group({
    slug: ['', [Validators.required, Validators.minLength(2)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.itemId.set(id);
      this.isEdit.set(true);
      this.loadItem(id);
    }
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  private loadItem(id: string): void {
    this.loading.set(true);
    this.gamesService.getById(id).subscribe({
      next: (item) => {
        this.form.patchValue({ slug: item.slug });
        this.existingImageUrl.set(item.imageUrl);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error(this.t.translate('gameForm.loadError'));
        this.loading.set(false);
      },
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.processFile(file, input);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.processFile(file);
  }

  private processFile(file: File | null, inputRef?: HTMLInputElement): void {
    this.imageRequired.set(false);
    this.imageSizeError.set(false);
    this.imageTypeError.set(false);
    this.previewLoadError.set(false);
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    if (file && !isFileTypeValid(file)) {
      this.imageTypeError.set(true);
      this.selectedFile.set(null);
      this.previewUrl.set(null);
      if (inputRef) inputRef.value = '';
      return;
    }
    if (file && !isFileSizeValid(file)) {
      this.imageSizeError.set(true);
      this.selectedFile.set(null);
      this.previewUrl.set(null);
      if (inputRef) inputRef.value = '';
      return;
    }
    this.selectedFile.set(file);
    if (file) {
      this.objectUrl = URL.createObjectURL(file);
      this.previewUrl.set(this.objectUrl);
    } else {
      this.previewUrl.set(null);
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    if (!this.isEdit() && !this.selectedFile()) {
      this.imageRequired.set(true);
      return;
    }
    const file = this.selectedFile();
    let _isValidSizeFile = true;
    if (file) {
      _isValidSizeFile = isFileSizeValid(file);
    }
    if (file && !_isValidSizeFile) {
      this.imageSizeError.set(true);
      return;
    }
    this.saving.set(true);
    const fd = new FormData();
    fd.append('slug', this.form.controls.slug.value);
    if (file) {
      fd.append('image', file);
    }
    const obs$ = this.isEdit()
      ? this.gamesService.update(this.itemId()!, fd)
      : this.gamesService.create(fd);

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

  hasError(field: 'slug'): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }
}
