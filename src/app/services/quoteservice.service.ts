import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Quote } from '../models/quote';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuoteserviceService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getQuotesByUser(userId: number): Observable<Quote[]> {
    const url = `${this.apiUrl}/users/${userId}/quotes`;
    return this.http.get<Quote[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  getAllQuotes(): Observable<Quote[]> {
    const url = `${this.apiUrl}/quotes`;
    return this.http.get<Quote[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  addQuote(quote: Quote): Observable<Quote> {
    const userId = localStorage.getItem('userId');
    if (!userId) return throwError(() => new Error('User not logged in'));
    const url = `${this.apiUrl}/users/${userId}/quotes`;
    return this.http.post<Quote>(url, quote, { headers: this.getAuthHeaders() })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  updateQuote(id: number, quote: Quote): Observable<any> {
    const url = `${this.apiUrl}/quotes/${id}`;
    return this.http.put(url, quote, { headers: this.getAuthHeaders() })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  deleteQuote(id: number): Observable<any> {
    const url = `${this.apiUrl}/quotes/${id}`;
    return this.http.delete(url, { headers: this.getAuthHeaders() })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}
