import { Component, inject, signal, computed, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfilesService } from '../services/profiles.service';
import { SectionsService } from '../../sections/services/sections.service';
import { Section } from '../../sections/models/section.model';
import { ProfileSelectedSection } from '../models/profile.model';
import { ToastService } from '../../../core/services/toast.service';
import { isFileSizeValid, isFileTypeValid } from '../../../shared/utils/file-validation.utils';
import { getIconUrl } from '../../../shared/icons/icon-names';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink, TranslocoPipe],
  templateUrl: './profile-form.component.html',
})
export class ProfileFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly profilesService = inject(ProfilesService);
  private readonly sectionsService = inject(SectionsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly itemId = signal<string | null>(null);
  readonly isEdit = signal(false);

  // ── Image uploads ─────────────────────────────────────────────────────────
  readonly selectedAvatar = signal<File | null>(null);
  readonly previewAvatar = signal<string | null>(null);
  readonly currentAvatarUrl = signal<string | null>(null);
  readonly avatarTypeError = signal(false);
  readonly avatarSizeError = signal(false);

  readonly selectedCard = signal<File | null>(null);
  readonly previewCard = signal<string | null>(null);
  readonly currentCardUrl = signal<string | null>(null);
  readonly cardTypeError = signal(false);
  readonly cardSizeError = signal(false);

  readonly selectedBanner = signal<File | null>(null);
  readonly previewBanner = signal<string | null>(null);
  readonly currentBannerUrl = signal<string | null>(null);
  readonly bannerTypeError = signal(false);
  readonly bannerSizeError = signal(false);

  readonly isDragOverAvatar = signal(false);
  readonly isDragOverCard = signal(false);
  readonly isDragOverBanner = signal(false);

  private avatarObjectUrl: string | null = null;
  private cardObjectUrl: string | null = null;
  private bannerObjectUrl: string | null = null;

  // ── All sections (loaded once, client-side pagination) ────────────────────
  readonly allSections = signal<Section[]>([]);
  readonly sectionsLoading = signal(false);
  readonly sectionsSearch = signal('');
  readonly sectionsPage = signal(1);
  readonly sectionsPerPage = 10;

  readonly filteredSections = computed(() => {
    const q = this.sectionsSearch().toLowerCase().trim();
    return !q
      ? this.allSections()
      : this.allSections().filter(
          (s) =>
            s.title.toLowerCase().includes(q) || s.icon.toLowerCase().includes(q),
        );
  });

  readonly sectionsTotal = computed(() => this.filteredSections().length);
  readonly sectionsLastPage = computed(() =>
    Math.max(1, Math.ceil(this.sectionsTotal() / this.sectionsPerPage)),
  );
  readonly pagedSections = computed(() => {
    const start = (this.sectionsPage() - 1) * this.sectionsPerPage;
    return this.filteredSections().slice(start, start + this.sectionsPerPage);
  });
  readonly sectionsPageNumbers = computed(() => {
    const last = this.sectionsLastPage();
    const current = this.sectionsPage();
    const half = 2;
    let start = Math.max(1, current - half);
    let end = Math.min(last, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  // ── Selected sections (ordered by priority) ───────────────────────────────
  readonly selectedSections = signal<ProfileSelectedSection[]>([]);

  readonly selectedSectionIds = computed(
    () => new Set(this.selectedSections().map((s) => s.sectionId)),
  );

  // ── Drag & drop state ─────────────────────────────────────────────────────
  readonly dragFromIndex = signal<number | null>(null);
  readonly dragOverIndex = signal<number | null>(null);

  readonly getIconUrl = getIconUrl;

  // ── Form ──────────────────────────────────────────────────────────────────
  readonly form = this.fb.nonNullable.group({
    nickname: ['', [Validators.required, Validators.minLength(2), this.urlSlugValidator]],
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    bio: [''],
    city: [''],
    state: [''],
    country: [''],
    themeColor: [''],
    priority: [0, [Validators.required, Validators.min(0)]],
    isEnabled: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.itemId.set(id);
      this.isEdit.set(true);
      this.loadEditData(id);
    } else {
      this.loadAllSections();
    }

    // Live sanitization: normalize nickname to URL-safe slug as the user types
    this.form.controls.nickname.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        const sanitized = this.sanitizeNicknameInput(val);
        if (sanitized !== val) {
          this.form.controls.nickname.setValue(sanitized, { emitEvent: false });
        }
      });
  }

  ngOnDestroy(): void {
    if (this.avatarObjectUrl) URL.revokeObjectURL(this.avatarObjectUrl);
    if (this.cardObjectUrl) URL.revokeObjectURL(this.cardObjectUrl);
    if (this.bannerObjectUrl) URL.revokeObjectURL(this.bannerObjectUrl);
  }

  private loadEditData(id: string): void {
    this.loading.set(true);
    forkJoin({
      profile: this.profilesService.getById(id),
      sections: this.sectionsService.getAll({ perPage: 10 }),
    }).subscribe({
      next: ({ profile, sections }) => {
        this.form.patchValue({
          nickname: profile.nickname,
          displayName: profile.displayName,
          bio: profile.bio,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          themeColor: profile.themeColor,
          priority: profile.priority,
          isEnabled: profile.isEnabled,
        });

        this.currentAvatarUrl.set(profile.avatarUrl ?? null);
        this.currentCardUrl.set(profile.cardUrl ?? null);
        this.currentBannerUrl.set(profile.bannerUrl ?? null);

        this.allSections.set(sections.items);

        const sectionMap = new Map(sections.items.map((s) => [s.id, s]));
        const selected: ProfileSelectedSection[] = profile.sections
          .slice()
          .sort((a, b) => a.priority - b.priority)
          .map((ps) => ({
            sectionId: ps.id,
            icon: sectionMap.get(ps.id)?.icon ?? ps.icon,
            title: sectionMap.get(ps.id)?.title ?? ps.title,
            priority: ps.priority,
          }));

        this.selectedSections.set(selected);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error(this.t.translate('profileForm.loadError'));
        this.loading.set(false);
      },
    });
  }

  private loadAllSections(): void {
    this.sectionsLoading.set(true);
    this.sectionsService.getAll({ perPage: 10 }).subscribe({
      next: (res) => {
        this.allSections.set(res.items);
        this.sectionsLoading.set(false);
      },
      error: () => {
        this.toastService.error(this.t.translate('profileForm.sectionsLoadError'));
        this.sectionsLoading.set(false);
      },
    });
  }

  // ── Image handlers ────────────────────────────────────────────────────────
  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.processImage('avatar', input.files?.[0] ?? null, input);
  }

  onCardChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.processImage('card', input.files?.[0] ?? null, input);
  }

  onBannerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.processImage('banner', input.files?.[0] ?? null, input);
  }

  onDragOverAvatar(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.isDragOverAvatar.set(true); }
  onDragLeaveAvatar(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.isDragOverAvatar.set(false); }
  onDropAvatar(e: DragEvent): void {
    e.preventDefault(); e.stopPropagation(); this.isDragOverAvatar.set(false);
    this.processImage('avatar', e.dataTransfer?.files?.[0] ?? null);
  }

  onDragOverCard(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.isDragOverCard.set(true); }
  onDragLeaveCard(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.isDragOverCard.set(false); }
  onDropCard(e: DragEvent): void {
    e.preventDefault(); e.stopPropagation(); this.isDragOverCard.set(false);
    this.processImage('card', e.dataTransfer?.files?.[0] ?? null);
  }

  onDragOverBanner(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.isDragOverBanner.set(true); }
  onDragLeaveBanner(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.isDragOverBanner.set(false); }
  onDropBanner(e: DragEvent): void {
    e.preventDefault(); e.stopPropagation(); this.isDragOverBanner.set(false);
    this.processImage('banner', e.dataTransfer?.files?.[0] ?? null);
  }

  private processImage(
    field: 'avatar' | 'card' | 'banner',
    file: File | null | undefined,
    inputRef?: HTMLInputElement,
  ): void {
    const typeErrorFn = field === 'avatar' ? this.avatarTypeError : field === 'card' ? this.cardTypeError : this.bannerTypeError;
    const sizeErrorFn = field === 'avatar' ? this.avatarSizeError : field === 'card' ? this.cardSizeError : this.bannerSizeError;
    const selectedFn = field === 'avatar' ? this.selectedAvatar : field === 'card' ? this.selectedCard : this.selectedBanner;
    const previewFn = field === 'avatar' ? this.previewAvatar : field === 'card' ? this.previewCard : this.previewBanner;

    typeErrorFn.set(false);
    sizeErrorFn.set(false);

    // Revoke previous object URL
    if (field === 'avatar' && this.avatarObjectUrl) { URL.revokeObjectURL(this.avatarObjectUrl); this.avatarObjectUrl = null; }
    if (field === 'card' && this.cardObjectUrl) { URL.revokeObjectURL(this.cardObjectUrl); this.cardObjectUrl = null; }
    if (field === 'banner' && this.bannerObjectUrl) { URL.revokeObjectURL(this.bannerObjectUrl); this.bannerObjectUrl = null; }

    if (!file) { selectedFn.set(null); previewFn.set(null); return; }

    if (!isFileTypeValid(file)) {
      typeErrorFn.set(true);
      selectedFn.set(null); previewFn.set(null);
      if (inputRef) inputRef.value = '';
      return;
    }
    if (!isFileSizeValid(file)) {
      sizeErrorFn.set(true);
      selectedFn.set(null); previewFn.set(null);
      if (inputRef) inputRef.value = '';
      return;
    }

    const url = URL.createObjectURL(file);
    if (field === 'avatar') this.avatarObjectUrl = url;
    if (field === 'card') this.cardObjectUrl = url;
    if (field === 'banner') this.bannerObjectUrl = url;

    selectedFn.set(file);
    previewFn.set(url);
  }

  // ── Section selector ──────────────────────────────────────────────────────
  onSectionsSearchChange(value: string): void {
    this.sectionsSearch.set(value);
    this.sectionsPage.set(1);
  }

  goToSectionsPage(p: number): void {
    if (p < 1 || p > this.sectionsLastPage()) return;
    this.sectionsPage.set(p);
  }

  toggleSection(section: Section): void {
    const current = this.selectedSections();
    const idx = current.findIndex((s) => s.sectionId === section.id);
    if (idx >= 0) {
      this.selectedSections.set(
        current.filter((_, i) => i !== idx).map((s, i) => ({ ...s, priority: i + 1 })),
      );
    } else {
      this.selectedSections.set([
        ...current,
        {
          sectionId: section.id,
          icon: section.icon,
          title: section.title,
          priority: current.length + 1,
        },
      ]);
    }
  }

  removeSelectedSection(index: number): void {
    this.selectedSections.set(
      this.selectedSections()
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
    const items = [...this.selectedSections()];
    const [moved] = items.splice(from, 1);
    items.splice(index, 0, moved);
    this.selectedSections.set(items.map((s, i) => ({ ...s, priority: i + 1 })));
    this.dragFromIndex.set(null);
    this.dragOverIndex.set(null);
  }

  onDragEnd(): void {
    this.dragFromIndex.set(null);
    this.dragOverIndex.set(null);
  }

  // ── Nickname sanitization ─────────────────────────────────────────────────
  /** Permissive: used during live typing — does NOT trim trailing hyphens so
   *  the user can type "word-word" (hyphen in the middle) naturally. */
  private sanitizeNicknameInput(value: string): string {
    return value
      .normalize('NFD')                 // decompose accented chars
      .replace(/[\u0300-\u036f]/g, '')  // strip diacritical marks
      .toLowerCase()
      .replace(/[\s_]+/g, '-')          // spaces and underscores → hyphens
      .replace(/[^a-z0-9-]/g, '')       // remove non URL-safe chars
      .replace(/-{2,}/g, '-');           // collapse consecutive hyphens
      // Note: trailing hyphen is intentionally kept so the user can keep typing
  }

  /** Full sanitization: used on submit — removes leading/trailing hyphens. */
  private sanitizeNickname(value: string): string {
    return this.sanitizeNicknameInput(value)
      .replace(/^-+|-+$/g, '');         // trim leading/trailing hyphens
  }

  private urlSlugValidator(control: AbstractControl): ValidationErrors | null {
    const val: string = control.value ?? '';
    if (!val) return null;
    return /^[a-z0-9][a-z0-9-]*$/.test(val) ? null : { urlSlug: true };
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  onSubmit(): void {
    // Ensure nickname is sanitized even if valueChanges didn't fire
    const rawNickname = this.form.controls.nickname.value;
    const sanitizedNickname = this.sanitizeNickname(rawNickname);
    if (sanitizedNickname !== rawNickname) {
      this.form.controls.nickname.setValue(sanitizedNickname, { emitEvent: false });
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nickname, displayName, bio, city, state, country, themeColor, priority, isEnabled } =
      this.form.getRawValue();
    const id = this.itemId();

    const fd = new FormData();
    fd.append('Nickname', this.sanitizeNickname(nickname));
    fd.append('DisplayName', displayName);
    fd.append('Bio', bio);
    fd.append('City', city);
    fd.append('State', state);
    fd.append('Country', country);
    fd.append('ThemeColor', themeColor);
    fd.append('Priority', String(priority));
    fd.append('IsEnabled', String(isEnabled));

    if (this.selectedAvatar()) fd.append('AvatarImage', this.selectedAvatar()!);
    if (this.selectedCard()) fd.append('CardImage', this.selectedCard()!);
    if (this.selectedBanner()) fd.append('BannerImage', this.selectedBanner()!);

    this.selectedSections().forEach((s, i) => {
      fd.append(`Sections[${i}].SectionId`, s.sectionId);
      fd.append(`Sections[${i}].Priority`, String(s.priority));
    });

    this.saving.set(true);
    const obs = id
      ? this.profilesService.update(id, fd)
      : this.profilesService.create(fd);

    obs.subscribe({
      next: () => {
        this.toastService.success(
          this.t.translate(id ? 'profileForm.updateSuccess' : 'profileForm.createSuccess'),
        );
        this.router.navigate(['/profiles']);
      },
      error: (e) => {
        const message = e.error ? e.error.message : 'profileForm.saveError';
        this.toastService.error(this.t.translate(message));
        this.saving.set(false);
      },
    });
  }
}
