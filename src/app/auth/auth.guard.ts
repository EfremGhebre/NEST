import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const isAuthed = authService.isAuthenticated();
  const userId = localStorage.getItem('userId');

  // If not authenticated, just redirect to login WITHOUT clearing storage.
  // HMR/full reloads can briefly cause guard to run before storage is ready.
  if (!isAuthed || !userId) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};