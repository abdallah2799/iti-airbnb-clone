import { TestBed } from '@angular/core/testing';

import { ListingCreationService } from './listing-creation.service';

describe('ListingCreationService', () => {
  let service: ListingCreationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListingCreationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
