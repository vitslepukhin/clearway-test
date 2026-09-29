import { afterNextRender, DestroyRef, Directive, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { animationFrameScheduler, EMPTY, fromEvent, merge, Observable } from 'rxjs';
import { auditTime } from 'rxjs/operators';

@Directive({
  selector: '[appHostRect]',
})
export class HostRectDirective {
  readonly rect = signal<DOMRectReadOnly | null>(null);

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.measure();
      this.watchGeometryChanges();
    });
  }

  private measure(): void {
    if (this.element.isConnected) {
      this.rect.set(this.element.getBoundingClientRect());
    }
  }

  private watchGeometryChanges(): void {
    const resize$ = new Observable<void>((subscriber) => {
      const observer = new ResizeObserver(() => subscriber.next());
      observer.observe(this.element);
      return () => observer.disconnect();
    });

    const mutation$ = new Observable<void>((subscriber) => {
      const observer = new MutationObserver(() => subscriber.next());
      observer.observe(this.element, {
        attributes: true,
        attributeFilter: ['style'],
      });
      return () => observer.disconnect();
    });

    const scroll$ = fromEvent(document, 'scroll', {
      capture: true,
      passive: true,
    });
    const windowResize$ = fromEvent(window, 'resize');
    const viewportChange$ = visualViewport
      ? merge(
          fromEvent(visualViewport, 'resize'),
          fromEvent(visualViewport, 'scroll'),
        )
      : EMPTY;

    merge(resize$, mutation$, scroll$, windowResize$, viewportChange$)
      .pipe(
        auditTime(0, animationFrameScheduler),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.measure());
  }
}
