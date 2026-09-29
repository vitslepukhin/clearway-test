import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { DocumentInfo } from '../../../api/document/document.model';
import { Annotation } from '../../../shared/annotations/annotation.model';
import { AnnotationsDirective } from '../../../shared/annotations/annotations.directive';
import { ZOOM } from '../../../shared/zoom';

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const EMPTY_ANNOTATIONS: Annotation[] = [];

@Component({
  selector: 'app-document-viewer',
  imports: [NgOptimizedImage, NgTemplateOutlet, AnnotationsDirective, ZOOM],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss',
})
export class DocumentViewerComponent {
  readonly documentId = input.required<string>();
  readonly document = input.required<DocumentInfo>();

  private readonly pageAnnotations = signal<ReadonlyMap<number, Annotation[]>>(
    new Map(),
  );

  protected readonly PAGE_WIDTH = PAGE_WIDTH;
  protected readonly PAGE_HEIGHT = PAGE_HEIGHT;

  protected readonly firstPage = computed(() => this.document().pages[0]);
  protected readonly restPages = computed(() => this.document().pages.slice(1));

  protected pageSrc(imageUrl: string): string {
    return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  }

  protected annotationsOf(pageNumber: number): Annotation[] {
    return this.pageAnnotations().get(pageNumber) ?? EMPTY_ANNOTATIONS;
  }

  protected setAnnotations(pageNumber: number, annotations: Annotation[]): void {
    this.pageAnnotations.update((map) =>
      new Map(map).set(pageNumber, annotations),
    );
  }

  protected onSave(): void {
    const pages = [...this.pageAnnotations()].map(
      ([pageNumber, annotations]) => ({ pageNumber, annotations }),
    );
    console.info('Документ:', {
      documentId: this.documentId(),
      document: this.document(),
    });
    console.info('Аннотации по страницам:', pages);
  }
}
