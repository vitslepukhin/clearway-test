import { InjectionToken, Signal } from '@angular/core';

import { Annotation } from './annotation.model';

export interface AnnotationContext {
  readonly hostRect: Signal<DOMRectReadOnly | null>;
  readonly scale: Signal<number>;
  update(annotation: Annotation): void;
  remove(id: Annotation['id']): void;
}

export const ANNOTATION_CONTEXT = new InjectionToken<AnnotationContext>(
  'ANNOTATION_CONTEXT',
);
