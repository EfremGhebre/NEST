import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthGuard } from '../auth/auth.guard';

const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
};

describe('AuthGuard', () => {
  const executeGuard = () =>
    TestBed.runInInjectionContext(() => new AuthGuard(TestBed.inject(Router)).canActivate());

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
      ],
    });
    localStorage.clear();
  });

  it('should allow access if authenticated', () => {
    localStorage.setItem('authToken', 'token');
    localStorage.setItem('userId', '123');
    expect(executeGuard()).toBe(true);
  });

  it('should deny access and navigate to login if not authenticated', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    expect(executeGuard()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
