import { TestBed } from '@angular/core/testing';

import { NflDataService } from './nfl-data.service';

describe('NflDataService', () => {
  let service: NflDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NflDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
