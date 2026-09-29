import { Routes } from '@angular/router';

import { DocumentViewerComponent } from './document-viewer/document-viewer.component';
import { documentResolver } from './document.resolver';

export const DOCUMENT_ROUTES: Routes = [
  {
    path: ':documentId',
    component: DocumentViewerComponent,
    resolve: {
      document: documentResolver,
    },
  },
];
