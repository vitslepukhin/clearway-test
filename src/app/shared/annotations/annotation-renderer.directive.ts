import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  Directive,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injector,
} from '@angular/core';
import { Annotation } from './annotation.model';
import { AnnotationTypeDefinition, ANNOTATION_TYPES } from './annotation-type';

type AnnotationId = Annotation['id'];

@Directive({
  selector: '[appAnnotationRenderer]',
})
export class AnnotationRenderer {
  private readonly hostElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);
  private readonly appRef = inject(ApplicationRef);

  private readonly typeMap = new Map(
    inject(ANNOTATION_TYPES).map(
      (item): [string, AnnotationTypeDefinition] => [item.type, item],
    ),
  );
  private readonly renderedComponentsMap = new Map<AnnotationId, ComponentRef<unknown>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destroyAll());
  }

  render(annotations: readonly Annotation[]): void {
    this.destroyRemoved(annotations);
    this.mountOrUpdate(annotations);
  }

  private destroyRemoved(annotations: readonly Annotation[]): void {
    const nextIdsSet = new Set(annotations.map((item) => item.id));

    for (const [id, ref] of this.renderedComponentsMap) {
      if (!nextIdsSet.has(id)) {
        this.destroyComponent(id, ref);
      }
    }
  }

  private mountOrUpdate(annotations: readonly Annotation[]): void {
    for (const annotation of annotations) {
      const existingComponentRef = this.renderedComponentsMap.get(annotation.id);
      if (existingComponentRef) {
        existingComponentRef.setInput('annotation', annotation);
        continue;
      }
      this.mount(annotation);
    }
  }

  private destroyAll(): void {
    for (const [id, componentRef] of this.renderedComponentsMap) {
      this.destroyComponent(id, componentRef);
    }
  }

  private mount(annotation: Annotation): void {
    const typeDefinition = this.typeMap.get(annotation.type);
    if (!typeDefinition) {
      return;
    }

    const componentRef = createComponent(typeDefinition.component, {
      environmentInjector: this.environmentInjector,
      elementInjector: this.injector,
    });
    componentRef.setInput('annotation', annotation);
    this.hostElement.appendChild(componentRef.location.nativeElement);
    this.appRef.attachView(componentRef.hostView);
    this.renderedComponentsMap.set(annotation.id, componentRef);
  }

  private destroyComponent(id: AnnotationId, ref: ComponentRef<unknown>): void {
    this.appRef.detachView(ref.hostView);
    ref.destroy();
    this.renderedComponentsMap.delete(id);
  }
}
