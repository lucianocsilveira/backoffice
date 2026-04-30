import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { UsersService } from '../services/users.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly t = inject(TranslocoService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly userId = signal<string | null>(null);
  readonly isEdit = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['User', Validators.required],
    password: ['', Validators.minLength(6)],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(id);
      this.isEdit.set(true);
      this.form.controls.password.clearValidators();
      this.form.controls.password.updateValueAndValidity();
      this.loadUser(id);
    } else {
      this.form.controls.password.addValidators(Validators.required);
      this.form.controls.password.updateValueAndValidity();
    }
  }

  private loadUser(id: string): void {
    this.loading.set(true);
    this.usersService.getById(id).subscribe({
      next: (user) => {
        this.form.patchValue({
          name: user.username,
          email: user.email,
          role: user.role,
        });
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error(this.t.translate('userForm.loadError'));
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    const value = this.form.getRawValue();

    const obs$ = this.isEdit()
      ? this.usersService.update(this.userId()!, {
          username: value.name,
          email: value.email,
          password: value.password,
          role: value.role,
        })
      : this.usersService.create({
          username: value.name,
          email: value.email,
          role: value.role,
          password: value.password,
        });

    obs$.subscribe({
      next: () => {
        this.toastService.success(
          this.isEdit() ? this.t.translate('userForm.updateSuccess') : this.t.translate('userForm.createSuccess')
        );
        this.router.navigate(['/users']);
      },
      error: () => {
        this.toastService.error(this.t.translate('userForm.saveError'));
        this.saving.set(false);
      },
    });
  }

  hasError(field: 'name' | 'email' | 'role' | 'password'): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.invalid && ctrl.touched;
  }
}
