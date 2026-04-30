import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastComponent } from '../toast/toast.component';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, TranslocoPipe],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
  readonly langService = inject(LanguageService);

  readonly currentUser = this.authService.currentUser;
  readonly sidebarOpen = signal(true);
  readonly langMenuOpen = signal(false);
  readonly currentLangObj = computed(() =>
    this.langService.available.find((l) => l.code === this.langService.currentLang()) ?? this.langService.available[0]
  );

  readonly navItems: NavItem[] = [
    { label: 'layout.users', route: '/users', icon: 'users' },
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  selectLang(code: string): void {
    this.langService.setLang(code);
    this.langMenuOpen.set(false);
  }

  toggleLangMenu(): void {
    this.langMenuOpen.update((v) => !v);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    const name = this.currentUser()?.username ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
