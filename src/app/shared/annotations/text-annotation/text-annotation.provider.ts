import { Provider } from '@angular/core';
import { TextAnnotation } from '../annotation.model';
import { AnnotationCreateContext, ANNOTATION_TYPES } from '../annotation-type';
import { TextAnnotationComponent } from './text-annotation.component';

export function createTextAnnotation(
  context: AnnotationCreateContext,
): TextAnnotation {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    xPercent: context.xPercent,
    yPercent: context.yPercent,
    text: '',
  };
}

export const TEXT_ANNOTATION_TYPE_PROVIDER: Provider = {
  provide: ANNOTATION_TYPES,
  multi: true,
  useValue: {
    type: 'text',
    component: TextAnnotationComponent,
    create: createTextAnnotation,
  },
};
