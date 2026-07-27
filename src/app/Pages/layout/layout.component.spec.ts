import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { LayoutComponent } from './layout.component';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../auth/auth.service';
import { BookService } from '../../services/bookservice.service';
import { QuoteserviceService } from '../../services/quoteservice.service';
import { MovieService } from '../../services/movieservice.service';
import { DiaryService } from '../../services/diaryservice.service';
import { ActivityService } from '../../services/activityservice.service';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  routerSpy.url = '/layout/dashboard';
  const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
  const themeServiceStub = {
    theme$: of<'light' | 'dark'>('light'),
    getTheme: () => 'light',
    toggleTheme: jasmine.createSpy('toggleTheme')
  };
  const emptyList$ = of([]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ThemeService, useValue: themeServiceStub },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: BookService, useValue: { getBooksByUser: () => emptyList$ } },
        { provide: QuoteserviceService, useValue: { getQuotesByUser: () => emptyList$ } },
        { provide: MovieService, useValue: { getMoviesByUser: () => emptyList$ } },
        { provide: DiaryService, useValue: { getDiariesByUser: () => emptyList$ } },
        { provide: ActivityService, useValue: { getActivitiesByUser: () => emptyList$ } }
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

  it('should render home navigation item', () => {
    const element: HTMLElement = fixture.nativeElement;
    const homeButton = Array.from(element.querySelectorAll('button')).find(
      button => button.textContent?.includes('Home')
    );
    expect(homeButton).toBeTruthy();
  });
});
