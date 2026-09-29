import {
  afterNextRender,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { TextAnnotation } from '../annotation.model';
import { ANNOTATION_CONTEXT } from '../annotation-context';
import {
  DraggableDirective,
  DragPosition,
} from '../../drag-and-drop/draggable.directive';

@Component({
  selector: 'app-text-annotation',
  hostDirectives: [
    {
      directive: DraggableDirective,
      outputs: ['positionChange'],
    },
  ],
  host: {
    '[class.dragging]': 'draggable.dragging()',
    '[style.left.%]': 'annotation().xPercent',
    '[style.top.%]': 'annotation().yPercent',
    '(click)': '$event.stopPropagation()',
    '(positionChange)': 'onPositionChange($event)',
  },
  templateUrl: './text-annotation.component.html',
  styleUrl: './text-annotation.component.scss',
})
export class TextAnnotationComponent {
  readonly annotation = input.required<TextAnnotation>();

  private readonly annotationContext = inject(ANNOTATION_CONTEXT);
  protected readonly draggable = inject(DraggableDirective);

  protected readonly editing = signal(false);
  private readonly releasePointer = signal<DragPosition | null>(null);

  private readonly textInput =
    viewChild<ElementRef<HTMLInputElement>>('textInput');

  constructor() {
    this.draggable.baseTransform.set('translate(-50%, -50%)');

    effect(() => {
      const rect = this.annotationContext.hostRect();
      if (rect) {
        this.draggable.anchorPoint.set(this.anchorPoint(rect));
      }
    });

    effect(() => {
      this.draggable.scale.set(this.annotationContext.scale());
    });

    afterNextRender(() => {
      if (this.annotation().text) {
        return;
      }

      this.startEditing();
      setTimeout(() => this.textInput()?.nativeElement.focus());
    });

    effect(() => {
      if (!this.draggable.dragging()) {
        untracked(() => this.commitDrag());
      }
    });
  }

  protected onPositionChange(position: DragPosition): void {
    this.releasePointer.set(position);
  }

  protected commitText(value: string): void {
    this.editing.set(false);
    this.draggable.enabled.set(true);
    this.annotationContext.update({
      ...this.annotation(),
      text: value.trim(),
    });
  }

  protected onRemove(event: Event): void {
    event.stopPropagation();
    this.annotationContext.remove(this.annotation().id);
  }

  private startEditing(): void {
    this.editing.set(true);
    this.draggable.enabled.set(false);
  }

  private commitDrag(): void {
    const pointer = this.releasePointer();
    if (!pointer) {
      return;
    }

    this.releasePointer.set(null);

    const rect = this.annotationContext.hostRect();
    if (!rect) {
      return;
    }

    this.annotationContext.update({
      ...this.annotation(),
      xPercent: clampPercent(((pointer.x - rect.left) / rect.width) * 100),
      yPercent: clampPercent(((pointer.y - rect.top) / rect.height) * 100),
    });
  }

  private anchorPoint(rect: DOMRectReadOnly): DragPosition {
    const annotation = this.annotation();
    return {
      x: rect.left + (rect.width * annotation.xPercent) / 100,
      y: rect.top + (rect.height * annotation.yPercent) / 100,
    };
  }
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}
