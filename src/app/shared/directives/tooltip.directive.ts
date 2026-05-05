import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  Renderer2,
  inject,
} from '@angular/core';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') text = '';
  @Input() tooltipPlacement: TooltipPlacement = 'top';

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  private tooltipEl: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private outsideClickUnlisten: (() => void) | null = null;

  // ── Mouse (desktop) ──────────────────────────────────────────────────────

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.hideTimeout) { clearTimeout(this.hideTimeout); this.hideTimeout = null; }
    this.showTimeout = setTimeout(() => this.show(), 100);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.showTimeout) { clearTimeout(this.showTimeout); this.showTimeout = null; }
    this.hideTimeout = setTimeout(() => this.hide(), 80);
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────

  @HostListener('focus')
  onFocus(): void { this.show(); }

  @HostListener('blur')
  onBlur(): void { this.hide(); }

  // ── Touch (mobile) ───────────────────────────────────────────────────────

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    // Prevent the synthetic mouse events that some browsers fire after touch
    event.preventDefault();
    if (this.tooltipEl) {
      this.hide();
    } else {
      this.show();
      this.registerOutsideClick();
    }
  }

  private registerOutsideClick(): void {
    // Dismiss when the user taps anywhere outside the trigger element
    this.outsideClickUnlisten = this.renderer.listen(
      document,
      'touchstart',
      (e: TouchEvent) => {
        if (!this.el.nativeElement.contains(e.target as Node)) {
          this.hide();
        }
      },
    );
  }

  // ── Core ─────────────────────────────────────────────────────────────────

  private show(): void {
    if (this.tooltipEl || !this.text) return;

    const tooltip = this.renderer.createElement('div') as HTMLElement;
    tooltip.className = [
      'fixed z-[9999] max-w-xs px-3 py-2 text-xs leading-relaxed',
      'text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-xl',
      'whitespace-pre-line pointer-events-none',
      'opacity-0 transition-opacity duration-150',
      'border border-gray-200 dark:border-gray-600',
    ].join(' ');
    tooltip.textContent = this.text;
    document.body.appendChild(tooltip);
    this.tooltipEl = tooltip;

    computePosition(this.el.nativeElement, tooltip, {
      placement: this.tooltipPlacement,
      middleware: [offset(8), flip(), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      if (!this.tooltipEl) return;
      this.renderer.setStyle(this.tooltipEl, 'left', `${x}px`);
      this.renderer.setStyle(this.tooltipEl, 'top', `${y}px`);
      this.renderer.setStyle(this.tooltipEl, 'opacity', '1');
    });
  }

  private hide(): void {
    if (this.outsideClickUnlisten) {
      this.outsideClickUnlisten();
      this.outsideClickUnlisten = null;
    }
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
  }

  ngOnDestroy(): void {
    if (this.showTimeout) clearTimeout(this.showTimeout);
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.hide();
  }
}
