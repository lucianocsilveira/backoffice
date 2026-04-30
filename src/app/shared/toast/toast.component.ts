import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  private readonly svc = inject(ToastService);

  get toasts(): ToastItem[] {
    return this.svc.toasts();
  }

  dismiss(id: number): void {
    this.svc.dismiss(id);
  }

  toastClass(type: ToastType): string {
    const map: Record<ToastType, string> = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      warning: 'bg-yellow-500',
      info: 'bg-blue-600',
    };
    return map[type];
  }
}
