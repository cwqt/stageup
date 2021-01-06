import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOnboardingListComponent } from './admin-onboarding-list.component';

describe('AdminOnboardingListComponent', () => {
  let component: AdminOnboardingListComponent;
  let fixture: ComponentFixture<AdminOnboardingListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminOnboardingListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminOnboardingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
