import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Book } from '../models/book';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  //Add book to the backend
  addBook(book: Book): Observable<Book> {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }
    
    const url = `${this.apiUrl}/users/${userId}/books`;
    return this.http.post<Book>(url, book, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Used by books.component.ts in loadUserBooks()
  getBooksByUser(userId: number): Observable<Book[]> {
    const url = `${this.apiUrl}/users/${userId}/books`;
    return this.http.get<Book[]>(url, { headers: this.getAuthHeaders() })
      .pipe(
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  getAllBooks(): Observable<Book[]> {
    // Make sure this matches your backend route exactly
    const url = `${this.apiUrl}/books`;
    return this.http.get<Book[]>(url, { headers: this.getAuthHeaders() })
      .pipe(
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  // Used by books.component.ts in deleteBook()
  deleteBook(id: number): Observable<any> {
    const url = `${this.apiUrl}/books/${id}`;
    return this.http.delete(url, { headers: this.getAuthHeaders() })
      .pipe(
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  // Used by books.component.ts in saveEditedBook()
  updateBook(id: number, book: Book): Observable<any> {
    const url = `${this.apiUrl}/books/${id}`;
    return this.http.put(url, book, { headers: this.getAuthHeaders() })
      .pipe(
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  // Global error handler used by all methods
  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}