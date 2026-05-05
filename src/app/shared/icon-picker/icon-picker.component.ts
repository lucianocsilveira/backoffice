import {
  Component,
  ElementRef,
  HostListener,
  forwardRef,
  signal,
  computed,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ICON_NAMES, getIconUrl } from '../icons/icon-names';

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [FormsModule, TranslocoPipe],
  templateUrl: './icon-picker.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IconPickerComponent),
      multi: true,
    },
  ],
})
export class IconPickerComponent implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef);

  readonly isOpen = signal(false);
  readonly selected = signal<string | null>(null);
  readonly searchQuery = signal('');
  disabled = false;

  readonly filteredIcons = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    return !q
      ? (ICON_NAMES as string[])
      : (ICON_NAMES as string[]).filter((name) => name.toLowerCase().includes(q));
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.selected.set(value || null);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleOpen(): void {
    if (this.disabled) return;
    this.isOpen.set(!this.isOpen());
    if (!this.isOpen()) this.searchQuery.set('');
    this.onTouched();
  }

  selectIcon(name: string): void {
    this.selected.set(name);
    this.onChange(name);
    this.onTouched();
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  getIconUrl(name: string): string {
    return getIconUrl(name);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.searchQuery.set('');
    }
  }
}
