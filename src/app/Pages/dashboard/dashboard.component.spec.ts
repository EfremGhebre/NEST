import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { BookService } from '../../services/bookservice.service';
import { QuoteserviceService } from '../../services/quoteservice.service';
import { MovieService } from '../../services/movieservice.service';
import { DiaryService } from '../../services/diaryservice.service';
import { ActivityService } from '../../services/activityservice.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: BookService, useValue: { getBooksByUser: () => of([]) } },
        { provide: QuoteserviceService, useValue: { getQuotesByUser: () => of([]) } },
        { provide: MovieService, useValue: { getMoviesByUser: () => of([]) } },
        { provide: DiaryService, useValue: { getDiariesByUser: () => of([]) } },
        { provide: ActivityService, useValue: { getActivitiesByUser: () => of([]) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    (component as any).recentItems = [
      { type: 'activity', title: 'Walk', author: 'Fitness', date: 'Today', timestamp: Date.now() }
    ];
    fixture.detectChanges();
  });

  it('should render recent activity entries when present', () => {
    component.recentItems = [
      { type: 'activity', title: 'Walk', author: 'Fitness', date: 'Today', timestamp: Date.now() }
    ] as any;
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.recent-activity');
    const item = fixture.nativeElement.querySelector('.recent-item');
    expect(container).toBeTruthy();
    expect(item).toBeTruthy();
  });
});
