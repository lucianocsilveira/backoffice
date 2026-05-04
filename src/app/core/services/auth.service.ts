import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RefreshTokenResponse, AuthUser } from '../models/auth.model';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly _currentUser = signal<AuthUser | null>(this.loadUser());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  login(credentials: LoginRequest): Observable<AuthUser> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/api/auth/login`, credentials).pipe(
      tap((response) => {
        this.storeTokens(response.accessToken, response.refreshToken);
      }),
      switchMap((response) =>
        this.http.get<AuthUser>(`${this.apiUrl}/admin/users/${response.userId}`)
      ),
      tap((user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this._currentUser.set(user);
      })
    );
  }

  refresh(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<RefreshTokenResponse>(`${this.apiUrl}/api/auth/refresh`, { refreshToken })
      .pipe(
        tap((response) => {
          this.storeTokens(response.accessToken, response.refreshToken);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isTokenExpired(token?: string | null): boolean {
    const t = token ?? this.getToken();
    if (!t) return true;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      if (typeof payload['exp'] !== 'number') return false;
      return Date.now() >= payload['exp'] * 1000;
    } catch {
      return true;
    }
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
