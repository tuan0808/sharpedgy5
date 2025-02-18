import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Schedule_card } from './schedule_card';

describe('TableDataComponent', () => {
  let component: Schedule_card;
  let fixture: ComponentFixture<Schedule_card>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Schedule_card]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Schedule_card);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
