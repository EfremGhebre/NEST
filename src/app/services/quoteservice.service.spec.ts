import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { QuoteserviceService } from './quoteservice.service';

describe('QuoteserviceService', () => {
  let service: QuoteserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(QuoteserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
