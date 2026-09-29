import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'document/1',
  },
  {
    path: 'document',
    loadChildren: () =>
      import('./features/document-viewer/document.routes').then(
        (m) => m.DOCUMENT_ROUTES,
      ),
  },
];
