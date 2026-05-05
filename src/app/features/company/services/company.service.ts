import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Company } from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/company`;
  private readonly publicUrl = `${environment.apiUrl}/company`;
  private readonly apiKey = environment.apiKey;

  readonly company = signal<Company | null>(null);
  readonly companyLoaded = signal(false);

  loadCompany(): void {
    if (this.companyLoaded()) return;
    this.http
      .get<Company>(this.publicUrl, { headers: { 'X-API-Key': this.apiKey } })
      .subscribe({
        next: (c) => {
          this.company.set(c);
          this.companyLoaded.set(true);
        },
        error: () => {
          this.company.set(null);
          this.companyLoaded.set(true);
        },
      });
  }

  get(): Observable<Company> {
    return this.http.get<Company>(this.baseUrl);
  }

  create(payload: FormData): Observable<Company> {
    return this.http.post<Company>(this.baseUrl, payload).pipe(
      tap((c) => this.company.set(c))
    );
  }

  update(payload: FormData): Observable<Company> {
    return this.http.put<Company>(this.baseUrl, payload).pipe(
      tap((c) => this.company.set(c))
    );
  }

  remove(): Observable<void> {
    return this.http.delete<void>(this.baseUrl).pipe(
      tap(() => { this.company.set(null); this.companyLoaded.set(false); })
    );
  }
}
