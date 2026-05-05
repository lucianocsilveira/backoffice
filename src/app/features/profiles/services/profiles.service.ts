import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Profile,
  ProfileListResponse,
  ProfileListParams,
} from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/profiles`;

  getAll(params: ProfileListParams = {}): Observable<ProfileListResponse> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params.perPage != null) httpParams = httpParams.set('perPage', String(params.perPage));
    return this.http.get<ProfileListResponse>(this.baseUrl, { params: httpParams });
  }

  getById(id: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/${id}`);
  }

  create(formData: FormData): Observable<Profile> {
    return this.http.post<Profile>(this.baseUrl, formData);
  }

  update(id: string, formData: FormData): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/${id}`, formData);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
