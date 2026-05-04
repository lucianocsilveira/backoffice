import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Section,
  SectionListResponse,
  SectionListParams,
  SectionRequest,
} from '../models/section.model';

@Injectable({ providedIn: 'root' })
export class SectionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/sections`;

  getAll(params: SectionListParams = {}): Observable<SectionListResponse> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params.perPage != null) httpParams = httpParams.set('perPage', String(params.perPage));
    return this.http.get<SectionListResponse>(this.baseUrl, { params: httpParams });
  }

  getById(id: string): Observable<Section> {
    return this.http.get<Section>(`${this.baseUrl}/${id}`);
  }

  create(payload: SectionRequest): Observable<Section> {
    return this.http.post<Section>(this.baseUrl, payload);
  }

  update(id: string, payload: SectionRequest): Observable<Section> {
    return this.http.put<Section>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
