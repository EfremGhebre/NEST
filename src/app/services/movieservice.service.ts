import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Movie } from '../models/movie';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private apiUrl = '/api';
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });
  }

  getMoviesByUser(userId: number): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${this.apiUrl}/users/${userId}/movies`, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  addMovie(movie: Movie): Observable<Movie> {
    const userId = localStorage.getItem('userId');
    if (!userId) return throwError(() => new Error('User not logged in'));
    return this.http.post<Movie>(`${this.apiUrl}/users/${userId}/movies`, movie, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  updateMovie(id: number, movie: Movie): Observable<any> {
    return this.http.put(`${this.apiUrl}/movies/${id}`, movie, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  deleteMovie(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/movies/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }
}


