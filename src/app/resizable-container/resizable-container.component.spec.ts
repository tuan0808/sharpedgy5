import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResizableContainerComponent } from './resizable-container.component';

describe('ResizableContainerComponent', () => {
  let component: ResizableContainerComponent;
  let fixture: ComponentFixture<ResizableContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResizableContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResizableContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
