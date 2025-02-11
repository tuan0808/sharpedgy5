import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualWalletComponent } from './virtual-wallet.component';

describe('VirtualWalletComponent', () => {
  let component: VirtualWalletComponent;
  let fixture: ComponentFixture<VirtualWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualWalletComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VirtualWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
