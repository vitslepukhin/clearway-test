import { Directive, model } from '@angular/core';

import { Annotation } from './annotation.model';

type AnnotationId = Annotation['id'];

@Directive({
  selector: '[appAnnotationCollection]',
})
export class AnnotationCollectionDirective {
  readonly annotations = model<Annotation[]>([]);

  update(annotation: Annotation): void {
    this.annotations.update((items) =>
      items.map((item) => (item.id === annotation.id ? annotation : item)),
    );
  }

  remove(id: AnnotationId): void {
    this.annotations.update((items) => items.filter((item) => item.id !== id));
  }

  add(annotation: Annotation): void {
    this.annotations.update((items) => [...items, annotation]);
  }
}
