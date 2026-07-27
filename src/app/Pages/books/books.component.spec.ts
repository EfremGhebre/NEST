import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { BooksComponent } from './books.component';
import { BookService } from '../../services/bookservice.service';
import { ThemeService } from '../../services/theme.service';

describe('BooksComponent', () => {
  let component: BooksComponent;
  let fixture: ComponentFixture<BooksComponent>;
  const bookServiceStub = {
    getBooksByUser: () => of([]),
    getAllBooks: () => of([]),
    deleteBook: () => of(null),
    updateBook: (_id: number, payload: any) => of(payload)
  };
  const themeServiceStub = {
    layout$: of<'columns' | 'rows'>('columns'),
    getLayout: () => 'columns'
  };
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BooksComponent],
      providers: [
        { provide: BookService, useValue: bookServiceStub },
        { provide: ThemeService, useValue: themeServiceStub },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: {}, params: of({}), queryParams: of({}) } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BooksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open and close expanded detail modal', () => {
    const mockBook: any = { id: 1, title: 'Sample', author: 'Author', description: 'Desc' };
    component.openBookDetails(mockBook);
    expect(component.selectedBook?.id).toBe(1);

    component.closeBookDetails();
    expect(component.selectedBook).toBeNull();
  });

  it('should close edit modal on escape', () => {
    component.modalVisible = true;
    component.onEscapePressed();
    expect(component.modalVisible).toBeFalse();
  });

  it('should close delete confirmation on escape', () => {
    component.deleteTarget = { id: 2, title: 'Delete me', author: 'A', description: 'B', userId: 1 } as any;
    component.onEscapePressed();
    expect(component.deleteTarget).toBeNull();
  });
});
