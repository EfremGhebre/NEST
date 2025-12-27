import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Activity } from '../models/activity';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });
  }

  // Get all activities for a specific user
  getActivitiesByUser(userId: number): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/users/${userId}/activities`, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  // Get a specific activity by ID
  getActivityById(id: number): Observable<Activity> {
    return this.http.get<Activity>(`${this.apiUrl}/activities/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  // Create a new activity
  createActivity(activity: Activity): Observable<Activity> {
    const userId = localStorage.getItem('userId');
    if (!userId) return throwError(() => new Error('User not logged in'));
    return this.http.post<Activity>(`${this.apiUrl}/users/${userId}/activities`, activity, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  // Update an existing activity
  updateActivity(id: number, activity: Activity): Observable<Activity> {
    return this.http.put<Activity>(`${this.apiUrl}/activities/${id}`, activity, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  // Delete an activity
  deleteActivity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/activities/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  // Get activities by category
  getActivitiesByCategory(userId: number, category: string): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/users/${userId}/activities/category/${category}`, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  // Get activities by status
  getActivitiesByStatus(userId: number, status: string): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/users/${userId}/activities/status/${status}`, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }

  // Search activities
  searchActivities(userId: number, searchTerm: string): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/users/${userId}/activities/search?q=${searchTerm}`, { headers: this.getAuthHeaders() })
      .pipe(catchError((e: HttpErrorResponse) => throwError(() => e)));
  }
}
