import { InjectionToken, Type } from '@angular/core';

import {
  Annotation,
  AnnotationType,
} from './annotation.model';

export interface AnnotationCreateContext {
  xPercent: number;
  yPercent: number;
}

export interface AnnotationTypeDefinition {
  type: AnnotationType;
  component: Type<unknown>;
  create(context: AnnotationCreateContext): Annotation;
}

export const ANNOTATION_TYPES = new InjectionToken<AnnotationTypeDefinition[]>(
  'ANNOTATION_TYPES',
);
