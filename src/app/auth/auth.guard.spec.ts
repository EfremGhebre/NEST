import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';

const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
};

describe('AuthGuard', () => {
  const authServiceMock = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
  const executeGuard = () => TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

  beforeEach(() => {
    mockRouter.navigate.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: authServiceMock }
      ],
    });
    localStorage.clear();
  });

  it('should allow access if authenticated', () => {
    authServiceMock.isAuthenticated.and.returnValue(true);
    localStorage.setItem('userId', '123');
    expect(executeGuard()).toBe(true);
  });

  it('should deny access and navigate to auth if not authenticated', () => {
    authServiceMock.isAuthenticated.and.returnValue(false);
    localStorage.removeItem('userId');
    expect(executeGuard()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth']);
  });
});
