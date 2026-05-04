import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GameItem } from '../models/game-item.model';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/game-items`;

  getAll(): Observable<GameItem[]> {
    return this.http.get<GameItem[]>(this.baseUrl);
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
