import { Directive, ElementRef, computed, inject, output, signal } from '@angular/core';

export interface DragPosition {
  x: number;
  y: number;
}

@Directive({
  selector: '[appDraggable]',
  host: {
    '[style.transform]': 'transform()',
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class DraggableDirective {
  readonly positionChange = output<DragPosition>();

  readonly dragging = signal(false);
  readonly enabled = signal(true);

  readonly anchorPoint = signal<DragPosition>({ x: 0, y: 0 });

  readonly baseTransform = signal('');

  readonly scale = signal(1);

  private readonly livePointer = signal<DragPosition | null>(null);

  protected readonly transform = computed(() => {
    const pointer = this.livePointer();
    const base = this.baseTransform();
    if (!pointer) {
      return base;
    }

    const anchor = this.anchorPoint();
    const scale = this.scale();
    const dx = (pointer.x - anchor.x) / scale;
    const dy = (pointer.y - anchor.y) / scale;
    return `${base} translate(${dx}px, ${dy}px)`.trim();
  });

  private readonly hostEl = inject(ElementRef<HTMLElement>).nativeElement;

  private offsetX = 0;
  private offsetY = 0;

  protected onPointerDown(event: PointerEvent): void {
    if (!this.enabled() || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const { pointerId } = event;
    const box = this.hostEl.getBoundingClientRect();
    this.offsetX = event.clientX - (box.left + box.width / 2);
    this.offsetY = event.clientY - (box.top + box.height / 2);

    this.dragging.set(true);
    this.hostEl.setPointerCapture(pointerId);

    const gesture = new AbortController();
    const { signal } = gesture;

    this.hostEl.addEventListener(
      'pointermove',
      (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) {
          return;
        }
        const position: DragPosition = {
          x: moveEvent.clientX - this.offsetX,
          y: moveEvent.clientY - this.offsetY,
        };
        this.livePointer.set(position);
        this.positionChange.emit(position);
      },
      { signal },
    );

    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) {
        return;
      }

      this.hostEl.releasePointerCapture(pointerId);
      gesture.abort();
      this.dragging.set(false);
      this.livePointer.set(null);
    };

    this.hostEl.addEventListener('pointerup', onUp, { signal });
    this.hostEl.addEventListener('pointercancel', onUp, { signal });
  }
}
