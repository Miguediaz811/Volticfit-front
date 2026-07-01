import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SanctionAlertComponent } from './sanction-alert.component';

describe('SanctionAlertComponent', () => {
  let component: SanctionAlertComponent;
  let fixture: ComponentFixture<SanctionAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SanctionAlertComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SanctionAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
