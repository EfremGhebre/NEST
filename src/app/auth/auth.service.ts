import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
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
          localStorage.setItem('userName', name);
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
          localStorage.setItem('userName', name);
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
    this.router.navigate(['/login']);
  }
}
