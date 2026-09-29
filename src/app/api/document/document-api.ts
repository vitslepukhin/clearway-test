import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { DocumentInfo } from './document.model';

@Service()
export class DocumentApi {
  private readonly http = inject(HttpClient);

  getById(_id: string): Observable<DocumentInfo> {
    return this.http.get<DocumentInfo>('/mocks/1.json');
  }
}
