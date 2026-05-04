import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GameItem, GameItemListResponse, GameListParams } from '../models/game-item.model';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/game-items`;

  getAll(params: GameListParams = {}): Observable<GameItemListResponse> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params.perPage != null) httpParams = httpParams.set('perPage', String(params.perPage));
    return this.http.get<GameItemListResponse>(this.baseUrl, { params: httpParams });
  }

  getById(id: string): Observable<GameItem> {
    return this.http.get<GameItem>(`${this.baseUrl}/${id}`);
  }

  create(payload: FormData): Observable<GameItem> {
    return this.http.post<GameItem>(this.baseUrl, payload);
  }

  update(id: string, payload: FormData): Observable<GameItem> {
    return this.http.put<GameItem>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
