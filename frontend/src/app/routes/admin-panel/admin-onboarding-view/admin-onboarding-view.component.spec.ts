import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOnboardingViewComponent } from './admin-onboarding-view.component';

describe('AdminOnboardingViewComponent', () => {
  let component: AdminOnboardingViewComponent;
  let fixture: ComponentFixture<AdminOnboardingViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminOnboardingViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminOnboardingViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
