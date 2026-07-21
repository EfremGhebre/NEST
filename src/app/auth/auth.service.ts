import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { UserProfile } from '../models/user-profile';
import { UserSubscription } from '../models/user-subscription';
// Small helper to decode JWT payload without external deps
function decodeJwtPayload<T = unknown>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {} 

  private getAuthHeaders(): HttpHeaders { 
    const token = localStorage.getItem('authToken'); 
    return new HttpHeaders({ 'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}` 
      }); 
    } 
    
  getData(): Observable<any> { 
    const url = `${this.apiUrl}/data`; 
    const headers = this.getAuthHeaders(); 

    return this.http.get<any>(url, { headers }).pipe( 
      catchError((error) => { 
        console.error('Error fetching data:', error); 
        return throwError(error);  
      })
    );
  }
  postData(body: any): Observable<any> { 
    const url = `${this.apiUrl}/data`; 
    const headers = this.getAuthHeaders(); 
    
    return this.http.post<any>(url, body, { headers }).pipe( 
      catchError((error) => { 
        console.error('Error posting data:', error); 
        return throwError(error); 
        })
      );
    }
  
  register(name: string, email: string, password: string): Observable<any> {
    const url = `${this.apiUrl}/users/register`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  
    const body = { name, email, password };
  
    return this.http.post<any>(url, body, { headers }).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('authToken', response.token); // Store the token
          if (response.userId) {
            localStorage.setItem('userId', response.userId);
          }
          localStorage.setItem('userName', response.userName || name);
        }
      }),
      catchError((error) => {
        console.error('Error during registration:', error);
        return throwError(error); // Propagate the error to the component
      })
    );
  }      
  
  login(name: string, password: string): Observable<any> {
    const url = `${this.apiUrl}/users/login`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { name, password };

    return this.http.post<any>(url, body, { headers }).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('authToken', response.token); //Store token here only
          localStorage.setItem('userId', response.userId); //Store userId here only
          localStorage.setItem('userName', response.userName || name);
        }
      }),
      catchError((error) => {
        console.error('Error during login:', error);
        return throwError(() => new Error(error?.error?.message || 'Login failed.'));
      })
    );
  }
  
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return false;
    }

    type JwtPayload = { exp?: number };
    const decodedToken = decodeJwtPayload<JwtPayload>(token);
    if (!decodedToken || !decodedToken.exp) {
      return false;
    }
    const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
    const isTokenExpired = Date.now() > expirationTime;
  
    return !isTokenExpired;
  }

  logout(): void {
    localStorage.removeItem('authToken'); 
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    this.router.navigate(['/']);
  }

  getProfile(userId: number): Observable<UserProfile> {
    const url = `${this.apiUrl}/users/${userId}/profile`;
    return this.http.get<UserProfile>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(profile => {
        if (profile?.username) {
          localStorage.setItem('userName', profile.username);
        }
      }),
      catchError((error) => {
        return throwError(() => new Error(error?.error?.message || 'Failed to load profile.'));
      })
    );
  }

  updateProfile(userId: number, payload: Partial<UserProfile>): Observable<UserProfile> {
    const url = `${this.apiUrl}/users/${userId}/profile`;
    return this.http.put<UserProfile>(url, payload, { headers: this.getAuthHeaders() }).pipe(
      tap(profile => {
        if (profile?.username) {
          localStorage.setItem('userName', profile.username);
        }
      }),
      catchError((error) => {
        return throwError(() => new Error(error?.error?.message || 'Failed to update profile.'));
      })
    );
  }

  deleteAccount(userId: number): Observable<void> {
    const url = `${this.apiUrl}/users/${userId}`;
    return this.http.delete<void>(url, { headers: this.getAuthHeaders() }).pipe(
      catchError((error) => {
        return throwError(() => new Error(error?.error?.message || 'Failed to delete account.'));
      })
    );
  }

  getSubscription(userId: number): Observable<UserSubscription | null> {
    const url = `${this.apiUrl}/users/${userId}/subscription`;
    return this.http.get<UserSubscription | null>(url, { headers: this.getAuthHeaders() }).pipe(
      catchError((error) => {
        return throwError(() => new Error(error?.error?.message || 'Failed to load subscription.'));
      })
    );
  }

  saveSubscription(userId: number, payload: Partial<UserSubscription>): Observable<UserSubscription> {
    const url = `${this.apiUrl}/users/${userId}/subscription`;
    return this.http.put<UserSubscription>(url, payload, { headers: this.getAuthHeaders() }).pipe(
      catchError((error) => {
        return throwError(() => new Error(error?.error?.message || 'Failed to save subscription.'));
      })
    );
  }

  deleteSubscription(userId: number): Observable<void> {
    const url = `${this.apiUrl}/users/${userId}/subscription`;
    return this.http.delete<void>(url, { headers: this.getAuthHeaders() }).pipe(
      catchError((error) => {
        return throwError(() => new Error(error?.error?.message || 'Failed to delete subscription.'));
      })
    );
  }
}
