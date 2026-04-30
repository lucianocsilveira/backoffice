import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';
import { ApiPagedResponse, PagedResult, QueryParams } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/users`;

  getAll(query: QueryParams = {}): Observable<PagedResult<User>> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);
    if (query.search) params = params.set('search', query.search);
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.sortDesc !== undefined) params = params.set('sortDesc', query.sortDesc);
    return this.http.get<ApiPagedResponse<User>>(this.baseUrl, { params }).pipe(
      map((res) => ({
        items: res.items,
        totalCount: res.pagination.total,
        page: res.pagination.currentPage,
        pageSize: query.pageSize ?? 10,
        totalPages: res.pagination.lastPage,
      }))
    );
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
