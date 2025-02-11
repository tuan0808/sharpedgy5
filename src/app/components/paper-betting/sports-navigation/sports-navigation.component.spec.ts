import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportsNavigationComponent } from './sports-navigation.component';

describe('SportsNavigationComponent', () => {
  let component: SportsNavigationComponent;
  let fixture: ComponentFixture<SportsNavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportsNavigationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SportsNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
