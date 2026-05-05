import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastComponent } from '../toast/toast.component';
import { TitleCasePipe } from '@angular/common';
import { CompanyService } from '../../features/company/services/company.service';

interface NavItem {
  label: string;
  route: string;
  iconPath: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, TranslocoPipe, TitleCasePipe],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
  readonly langService = inject(LanguageService);
  readonly companyService = inject(CompanyService);
  readonly logoError = signal(false);

  readonly currentUser = this.authService.currentUser;
  readonly sidebarOpen = signal(true);
  readonly langMenuOpen = signal(false);
  readonly currentLangObj = computed(() =>
    this.langService.available.find((l) => l.code === this.langService.currentLang()) ?? this.langService.available[0]
  );

  ngOnInit(): void {
    this.companyService.loadCompany();
  }

  readonly navItems: NavItem[] = [
    {
      label: 'layout.company',
      route: '/company',
      iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    },
    {
      label: 'layout.users',
      route: '/users',
      iconPath: 'M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z',
    },
    {
      label: 'layout.games',
      route: '/games',
      iconPath: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
    },
    {
      label: 'layout.sections',
      route: '/sections',
      iconPath: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    },
    {
      label: 'layout.profiles',
      route: '/profiles',
      iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    }
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
