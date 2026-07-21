import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Router, useValue: routerSpy }]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login with username or email identifier payload', () => {
    service.login('user@example.com', 'password').subscribe(response => {
      expect(response.userId).toBe(1);
      expect(localStorage.getItem('userName')).toBe('user-one');
    });

    const req = httpMock.expectOne(request => request.url.endsWith('/users/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'user@example.com', password: 'password' });
    req.flush({ token: 'token', userId: 1, userName: 'user-one' });
  });

  it('should fetch profile data for current user', () => {
    service.getProfile(5).subscribe(profile => {
      expect(profile.username).toBe('tester');
      expect(localStorage.getItem('userName')).toBe('tester');
    });

    const req = httpMock.expectOne(request => request.url.endsWith('/users/5/profile'));
    expect(req.request.method).toBe('GET');
    req.flush({ id: 5, username: 'tester', firstName: '', lastName: '', email: 'tester@mail.com' });
  });
});
