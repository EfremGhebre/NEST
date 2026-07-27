import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { QuotesComponent } from './quotes.component';
import { QuoteserviceService } from '../../services/quoteservice.service';
import { ThemeService } from '../../services/theme.service';

describe('QuotesComponent', () => {
  let component: QuotesComponent;
  let fixture: ComponentFixture<QuotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotesComponent],
      providers: [
        { provide: QuoteserviceService, useValue: { getQuotesByUser: () => of([]), deleteQuote: () => of(null), updateQuote: (_id: number, body: any) => of(body) } },
        { provide: ThemeService, useValue: { layout$: of<'columns' | 'rows'>('columns'), getLayout: () => 'columns' } },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: ActivatedRoute, useValue: { snapshot: {}, params: of({}), queryParams: of({}) } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
