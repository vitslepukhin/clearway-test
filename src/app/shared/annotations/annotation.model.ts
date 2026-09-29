export type AnnotationType = 'text' | (string & {});

export interface AnnotationBase {
  id: string;
  type: AnnotationType;
  xPercent: number;
  yPercent: number;
}

export interface TextAnnotation extends AnnotationBase {
  type: 'text';
  text: string;
}

export type Annotation = TextAnnotation | AnnotationBase;
