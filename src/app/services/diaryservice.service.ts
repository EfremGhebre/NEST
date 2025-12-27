import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Diary } from '../models/diary';

@Injectable({ providedIn: 'root' })
export class DiaryService {
  private apiUrl = '/api';
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });
  }

  getDiariesByUser(userId: number): Observable<Diary[]> {
    return this.http.get<Diary[]>(`${this.apiUrl}/users/${userId}/diaries`, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  addDiary(diary: Diary): Observable<Diary> {
    const userId = localStorage.getItem('userId');
    if (!userId) return throwError(() => new Error('User not logged in'));
    return this.http.post<Diary>(`${this.apiUrl}/users/${userId}/diaries`, diary, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  updateDiary(id: number, diary: Diary): Observable<any> {
    return this.http.put(`${this.apiUrl}/diaries/${id}`, diary, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  deleteDiary(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/diaries/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }
}


