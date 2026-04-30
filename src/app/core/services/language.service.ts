import { Injectable, inject, signal, effect } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export interface Language {
  code: string;
  label: string;
  flag: string;
}

const STORAGE_KEY = 'app_lang';
const DEFAULT_LANG = 'pt-BR';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translocoService = inject(TranslocoService);

  readonly available: Language[] = [
    { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  readonly currentLang = signal<string>(this.loadLang());

  constructor() {
    effect(() => {
      const lang = this.currentLang();
      sessionStorage.setItem(STORAGE_KEY, lang);
      this.translocoService.setActiveLang(lang);
    });
  }

  setLang(code: string): void {
    this.currentLang.set(code);
  }

  private loadLang(): string {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return this.available.some((l) => l.code === stored) ? stored! : DEFAULT_LANG;
  }
}
