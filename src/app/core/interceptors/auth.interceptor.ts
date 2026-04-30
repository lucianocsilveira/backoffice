import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  if (!authService.getRefreshToken()) {
    authService.logout();
    router.navigate(['/login']);
    return throwError(() => new Error('No refresh token available.'));
  }

  if (isRefreshing) {
    return refreshDone$.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => next(addToken(req, token)))
    );
  }

  isRefreshing = true;
  refreshDone$.next(null);

  return authService.refresh().pipe(
    switchMap((response) => {
      isRefreshing = false;
      refreshDone$.next(response.accessToken);
      return next(addToken(req, response.accessToken));
    }),
    catchError((err) => {
      isRefreshing = false;
      authService.logout();
      router.navigate(['/login']);
      return throwError(() => err);
    })
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const clonedReq = token ? addToken(req, token) : req;

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401(req, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};
