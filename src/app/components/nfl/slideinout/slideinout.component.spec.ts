import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlideinoutComponent } from './slideinout.component';

describe('SlideinoutComponent', () => {
  let component: SlideinoutComponent;
  let fixture: ComponentFixture<SlideinoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlideinoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlideinoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
