import { TestBed } from '@angular/core/testing';

import { FuturamaService } from './futurama.service';

describe('FuturamaService', () => {
  let service: FuturamaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FuturamaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
