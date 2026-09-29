import { Directive, effect, inject, input } from '@angular/core';

import { Annotation, AnnotationType } from './annotation.model';
import { AnnotationCollectionDirective } from './annotation-collection.directive';
import { ANNOTATION_CONTEXT, AnnotationContext } from './annotation-context';
import { AnnotationRenderer } from './annotation-renderer.directive';
import { AnnotationSurfaceDirective } from './annotation-surface.directive';
import { ANNOTATION_TYPES } from './annotation-type';

@Directive({
  selector: '[appAnnotations]',
  hostDirectives: [
    AnnotationSurfaceDirective,
    AnnotationRenderer,
    {
      directive: AnnotationCollectionDirective,
      inputs: ['annotations: appAnnotations'],
      outputs: ['annotationsChange: appAnnotationsChange'],
    },
  ],
  providers: [
    { provide: ANNOTATION_CONTEXT, useExisting: AnnotationsDirective },
  ],
  host: {
    '[style.cursor]': '"crosshair"',
    '(click)': 'onHostClick($event)',
  },
})
export class AnnotationsDirective implements AnnotationContext {
  private readonly collection = inject(AnnotationCollectionDirective);
  private readonly surface = inject(AnnotationSurfaceDirective);
  private readonly renderer = inject(AnnotationRenderer);
  private readonly annotationTypes = inject(ANNOTATION_TYPES);

  readonly createType = input.required<AnnotationType>({
    alias: 'appAnnotationCreateType',
  });

  readonly hostRect = this.surface.rect;
  readonly scale = this.surface.scale;

  constructor() {
    effect(() => {
      this.renderer.render(this.collection.annotations());
    });
  }

  update(annotation: Annotation): void {
    this.collection.update(annotation);
  }

  remove(id: Annotation['id']): void {
    this.collection.remove(id);
  }

  protected onHostClick(event: MouseEvent): void {
    const typeDef = this.annotationTypes.find(
      (item) => item.type === this.createType(),
    );
    const rect = this.surface.rect();
    if (!typeDef || !rect) {
      return;
    }

    this.collection.add(
      typeDef.create({
        xPercent: ((event.clientX - rect.left) / rect.width) * 100,
        yPercent: ((event.clientY - rect.top) / rect.height) * 100,
      }),
    );
  }
}
