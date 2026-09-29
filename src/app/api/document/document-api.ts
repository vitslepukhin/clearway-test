import { PlatformLocation } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { DocumentInfo } from './document.model';

@Service()
export class DocumentApi {
  private readonly http = inject(HttpClient);
  private readonly baseHref = inject(PlatformLocation).getBaseHrefFromDOM();

  getById(_id: string): Observable<DocumentInfo> {
    return this.http.get<DocumentInfo>(`${this.baseHref}mocks/1.json`);
  }
}
