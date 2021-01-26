import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingViewComponent } from './onboarding-view.component';

describe('OnboardingViewComponent', () => {
  let component: OnboardingViewComponent;
  let fixture: ComponentFixture<OnboardingViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OnboardingViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OnboardingViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
