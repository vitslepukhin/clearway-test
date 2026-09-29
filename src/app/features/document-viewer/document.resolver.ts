import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { DocumentApi } from '../../api/document/document-api';
import { DocumentInfo } from '../../api/document/document.model';

export const documentResolver: ResolveFn<DocumentInfo> = (route) => {
  const documentApi = inject(DocumentApi);
  const documentId = route.paramMap.get('documentId');

  if (!documentId) {
    throw new Error('documentId is required');
  }

  return firstValueFrom(documentApi.getById(documentId));
};
