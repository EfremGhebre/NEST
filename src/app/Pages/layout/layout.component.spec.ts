import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { LayoutComponent } from './layout.component';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../auth/auth.service';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
  const themeServiceStub = {
    theme$: of<'light' | 'dark'>('light'),
    getTheme: () => 'light',
    toggleTheme: jasmine.createSpy('toggleTheme')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ThemeService, useValue: themeServiceStub },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render profile action in nav', () => {
    const element: HTMLElement = fixture.nativeElement;
    const profileButton = Array.from(element.querySelectorAll('button')).find(
      button => button.textContent?.trim() === 'Profile'
    );
    expect(profileButton).toBeTruthy();
  });
});
