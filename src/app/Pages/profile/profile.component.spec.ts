import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../auth/auth.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  const authServiceStub = {
    getProfile: () => of({ id: 1, username: 'tester', firstName: '', lastName: '', email: 'test@mail.com', createdAt: null }),
    getSubscription: () => of(null),
    updateProfile: (_id: number, payload: any) => of({ id: 1, createdAt: null, ...payload }),
    saveSubscription: (_id: number, payload: any) => of({ id: 1, userId: 1, ...payload }),
    deleteSubscription: () => of(undefined),
    deleteAccount: () => of(undefined),
    logout: jasmine.createSpy('logout')
  };

  beforeEach(async () => {
    localStorage.setItem('userId', '1');
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle profile editing mode', () => {
    component.startEditProfile();
    expect(component.isEditingProfile).toBeTrue();
    component.cancelEditProfile();
    expect(component.isEditingProfile).toBeFalse();
  });

  it('should close delete confirmation on escape', () => {
    component.confirmDeleteAccount();
    expect(component.showDeleteConfirm).toBeTrue();
    component.onEscapePressed();
    expect(component.showDeleteConfirm).toBeFalse();
  });
});
