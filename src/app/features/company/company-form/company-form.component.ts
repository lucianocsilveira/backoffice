import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CompanyService } from '../services/company.service';
import { ToastService } from '../../../core/services/toast.service';
import { Company } from '../models/company.model';
import { isFileSizeValid, isFileTypeValid } from '../../../shared/utils/file-validation.utils';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoPipe],
  templateUrl: './company-form.component.html',
})
export class CompanyFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);
  private readonly toastService = inject(ToastService);
  private readonly t = inject(TranslocoService);

  private objectUrl: string | null = null;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly company = signal<Company | null>(null);
  readonly notFound = signal(false);

  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly imageRequired = signal(false);
  readonly imageSizeError = signal(false);
  readonly imageTypeError = signal(false);
  readonly isDragOver = signal(false);
  readonly imageLoadError = signal(false);
  readonly previewLoadError = signal(false);
  readonly showDeleteConfirm = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    cnpj: ['', [Validators.required, Validators.minLength(14)]],
  });

  ngOnInit(): void {
    this.loadCompany();
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  private loadCompany(): void {
    this.loading.set(true);
    this.companyService.get().subscribe({
      next: (company) => {
        this.company.set(company);
        this.notFound.set(false);
        this.form.patchValue({ name: company.name, cnpj: this.formatCnpj(company.cnpj) });
        this.loading.set(false);
      },
      error: (err) => {
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.toastService.error(this.t.translate('company.loadError'));
        }
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
    const isEdit = this.company() !== null;
    if (!isEdit && !this.selectedFile()) {
      this.imageRequired.set(true);
      return;
    }
    this.saving.set(true);
    const fd = new FormData();
    fd.append('Name', this.form.controls.name.value);
    fd.append('Cnpj', this.form.controls.cnpj.value.replace(/\D/g, ''));
    if (this.selectedFile()) {
      fd.append('Logo', this.selectedFile()!);
    }
    const obs$ = isEdit
      ? this.companyService.update(fd)
      : this.companyService.create(fd);

    obs$.subscribe({
      next: (company) => {
        this.company.set(company);
        this.notFound.set(false);
        this.selectedFile.set(null);
        if (this.objectUrl) {
          URL.revokeObjectURL(this.objectUrl);
          this.objectUrl = null;
        }
        this.previewUrl.set(null);
        this.toastService.success(
          this.t.translate(isEdit ? 'company.updateSuccess' : 'company.createSuccess')
        );
        this.saving.set(false);
      },
      error: () => {
        this.toastService.error(this.t.translate('company.saveError'));
        this.saving.set(false);
      },
    });
  }

  confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  deleteCompany(): void {
    if (this.deleting()) return;
    this.deleting.set(true);
    this.showDeleteConfirm.set(false);
    this.companyService.remove().subscribe({
      next: () => {
        this.company.set(null);
        this.notFound.set(true);
        this.form.reset();
        this.selectedFile.set(null);
        this.previewUrl.set(null);
        if (this.objectUrl) {
          URL.revokeObjectURL(this.objectUrl);
          this.objectUrl = null;
        }
        this.toastService.success(this.t.translate('company.deleteSuccess'));
        this.deleting.set(false);
      },
      error: () => {
        this.toastService.error(this.t.translate('company.deleteError'));
        this.deleting.set(false);
      },
    });
  }

  hasError(field: 'name' | 'cnpj'): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  formatCnpj(value: string): string {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
}
